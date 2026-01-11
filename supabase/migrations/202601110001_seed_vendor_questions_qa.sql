-- Migration: Seed Vendor Questions and Q&A Data
-- Description: Add sample data for Vendor Questions and Q&A Management pages
-- Date: 2026-01-11

-- ============================================================================
-- SEED VENDOR QUESTIONS
-- ============================================================================
-- Add sample RFP questions for all evaluation projects that don't have questions

DO $$
DECLARE
    eval_project RECORD;
BEGIN
    -- For each evaluation project that has no questions
    FOR eval_project IN
        SELECT ep.id
        FROM evaluation_projects ep
        WHERE NOT EXISTS (
            SELECT 1 FROM vendor_questions vq
            WHERE vq.evaluation_project_id = ep.id AND vq.is_deleted = FALSE
        )
    LOOP
        -- Company Overview Questions (no options)
        INSERT INTO vendor_questions (evaluation_project_id, question_text, question_type, section, is_required, sort_order, guidance_for_vendors)
        VALUES
            (eval_project.id, 'Please provide a brief overview of your company, including year founded, headquarters location, and number of employees.', 'textarea', 'company_overview', TRUE, 1, 'Include key facts about your organization'),
            (eval_project.id, 'Describe your company''s experience in delivering similar solutions.', 'textarea', 'company_overview', TRUE, 2, 'Focus on relevant experience in this industry'),
            (eval_project.id, 'List any relevant certifications or accreditations your company holds.', 'textarea', 'company_overview', FALSE, 3, 'Include ISO, SOC2, or industry-specific certifications'),
            (eval_project.id, 'How long has your company been providing this type of solution?', 'number', 'company_overview', TRUE, 4, 'Enter number of years');

        -- Technical Yes/No Question
        INSERT INTO vendor_questions (evaluation_project_id, question_text, question_type, section, is_required, sort_order, guidance_for_vendors)
        VALUES
            (eval_project.id, 'Does your solution support cloud deployment?', 'yes_no', 'technical_capabilities', TRUE, 10, 'Indicate if cloud deployment is available');

        -- Technical Multi-select Question
        INSERT INTO vendor_questions (evaluation_project_id, question_text, question_type, section, is_required, sort_order, guidance_for_vendors, options)
        VALUES
            (eval_project.id, 'What deployment options are available?', 'multi_select', 'technical_capabilities', TRUE, 11, 'Select all that apply', '["SaaS / Cloud-hosted", "On-premises", "Hybrid", "Private Cloud"]');

        -- Technical Textarea Questions
        INSERT INTO vendor_questions (evaluation_project_id, question_text, question_type, section, is_required, sort_order, guidance_for_vendors)
        VALUES
            (eval_project.id, 'Describe your solution''s architecture and key technical components.', 'textarea', 'technical_capabilities', TRUE, 12, 'Include technology stack and integration capabilities'),
            (eval_project.id, 'What APIs or integration methods does your solution support?', 'textarea', 'technical_capabilities', TRUE, 13, 'List REST APIs, webhooks, connectors, etc.'),
            (eval_project.id, 'What is your current product version and release date?', 'text', 'technical_capabilities', TRUE, 14, 'E.g., Version 5.2, released October 2025');

        -- Technical Multiple Choice Question
        INSERT INTO vendor_questions (evaluation_project_id, question_text, question_type, section, is_required, sort_order, guidance_for_vendors, options)
        VALUES
            (eval_project.id, 'How often do you release product updates?', 'multiple_choice', 'technical_capabilities', TRUE, 15, 'Select the closest match', '["Weekly", "Monthly", "Quarterly", "Bi-annually", "Annually"]');

        -- Implementation Text Questions
        INSERT INTO vendor_questions (evaluation_project_id, question_text, question_type, section, is_required, sort_order, guidance_for_vendors)
        VALUES
            (eval_project.id, 'What is the typical implementation timeline for a project of this scope?', 'text', 'implementation', TRUE, 20, 'Provide realistic timeline in weeks/months'),
            (eval_project.id, 'Describe your implementation methodology and key phases.', 'textarea', 'implementation', TRUE, 21, 'Include planning, development, testing, and go-live phases'),
            (eval_project.id, 'What resources will you require from our team during implementation?', 'textarea', 'implementation', TRUE, 22, 'List required roles, time commitments, and access needs');

        -- Implementation Yes/No
        INSERT INTO vendor_questions (evaluation_project_id, question_text, question_type, section, is_required, sort_order, guidance_for_vendors)
        VALUES
            (eval_project.id, 'Do you provide data migration services?', 'yes_no', 'implementation', TRUE, 23, NULL);

        -- Implementation Multi-select
        INSERT INTO vendor_questions (evaluation_project_id, question_text, question_type, section, is_required, sort_order, guidance_for_vendors, options)
        VALUES
            (eval_project.id, 'What training options do you provide?', 'multi_select', 'implementation', TRUE, 24, 'Select all available options', '["On-site training", "Virtual/remote training", "Self-paced e-learning", "Train-the-trainer", "Documentation/manuals", "Video tutorials"]');

        -- Support Multiple Choice Questions
        INSERT INTO vendor_questions (evaluation_project_id, question_text, question_type, section, is_required, sort_order, guidance_for_vendors, options)
        VALUES
            (eval_project.id, 'What are your standard support hours?', 'multiple_choice', 'support', TRUE, 30, NULL, '["Business hours (9-5 local)", "Extended hours (7am-9pm)", "24/5", "24/7/365"]');

        -- Support Multi-select
        INSERT INTO vendor_questions (evaluation_project_id, question_text, question_type, section, is_required, sort_order, guidance_for_vendors, options)
        VALUES
            (eval_project.id, 'What support channels do you offer?', 'multi_select', 'support', TRUE, 31, 'Select all that apply', '["Phone", "Email", "Web portal/ticketing", "Live chat", "Dedicated account manager"]');

        -- Support Text Questions
        INSERT INTO vendor_questions (evaluation_project_id, question_text, question_type, section, is_required, sort_order, guidance_for_vendors)
        VALUES
            (eval_project.id, 'Describe your escalation process and SLA response times.', 'textarea', 'support', TRUE, 32, 'Include response and resolution times for different severity levels');

        -- Support Yes/No
        INSERT INTO vendor_questions (evaluation_project_id, question_text, question_type, section, is_required, sort_order, guidance_for_vendors)
        VALUES
            (eval_project.id, 'Do you provide a dedicated support contact or account manager?', 'yes_no', 'support', TRUE, 33, NULL);

        -- Security Yes/No
        INSERT INTO vendor_questions (evaluation_project_id, question_text, question_type, section, is_required, sort_order, guidance_for_vendors)
        VALUES
            (eval_project.id, 'Do you have SOC 2 Type II certification?', 'yes_no', 'security', TRUE, 40, 'If yes, please provide certificate date');

        -- Security Textarea Questions
        INSERT INTO vendor_questions (evaluation_project_id, question_text, question_type, section, is_required, sort_order, guidance_for_vendors)
        VALUES
            (eval_project.id, 'Describe your data encryption approach (at rest and in transit).', 'textarea', 'security', TRUE, 41, 'Include encryption standards and key management'),
            (eval_project.id, 'Where is customer data stored? List all data center locations.', 'textarea', 'security', TRUE, 42, 'Include cloud provider and region information'),
            (eval_project.id, 'Describe your disaster recovery and business continuity capabilities.', 'textarea', 'security', TRUE, 43, 'Include RTO, RPO, and backup procedures');

        -- Security Multiple Choice
        INSERT INTO vendor_questions (evaluation_project_id, question_text, question_type, section, is_required, sort_order, guidance_for_vendors, options)
        VALUES
            (eval_project.id, 'How often do you conduct security audits and penetration testing?', 'multiple_choice', 'security', TRUE, 44, NULL, '["Monthly", "Quarterly", "Annually", "On-demand", "Never"]');

        -- Pricing Multiple Choice
        INSERT INTO vendor_questions (evaluation_project_id, question_text, question_type, section, is_required, sort_order, guidance_for_vendors, options)
        VALUES
            (eval_project.id, 'What is your pricing model?', 'multiple_choice', 'pricing', TRUE, 50, NULL, '["Per user/month", "Per user/year", "Per transaction", "Flat fee", "Tiered pricing", "Custom quote"]');

        -- Pricing Textarea Questions
        INSERT INTO vendor_questions (evaluation_project_id, question_text, question_type, section, is_required, sort_order, guidance_for_vendors)
        VALUES
            (eval_project.id, 'Please provide a detailed cost breakdown for this project.', 'textarea', 'pricing', TRUE, 51, 'Include implementation, licensing, and ongoing costs'),
            (eval_project.id, 'Are there any additional fees not included in your standard pricing?', 'textarea', 'pricing', TRUE, 52, 'List any setup fees, training costs, integration fees, etc.'),
            (eval_project.id, 'What payment terms do you offer?', 'text', 'pricing', FALSE, 53, 'E.g., Net 30, annual prepaid, etc.');

        -- Pricing Yes/No
        INSERT INTO vendor_questions (evaluation_project_id, question_text, question_type, section, is_required, sort_order, guidance_for_vendors)
        VALUES
            (eval_project.id, 'Do you offer volume discounts for larger deployments?', 'yes_no', 'pricing', FALSE, 54, NULL);

        RAISE NOTICE 'Seeded vendor questions for evaluation project: %', eval_project.id;
    END LOOP;
END $$;

-- ============================================================================
-- SEED VENDOR Q&A
-- ============================================================================
-- Add sample Q&A interactions for evaluation projects with vendors

DO $$
DECLARE
    eval_project RECORD;
    vendor_rec RECORD;
    vendor_count INT;
BEGIN
    -- For each evaluation project that has vendors but no Q&A
    FOR eval_project IN
        SELECT ep.id
        FROM evaluation_projects ep
        WHERE EXISTS (
            SELECT 1 FROM vendors v WHERE v.evaluation_project_id = ep.id
        )
        AND NOT EXISTS (
            SELECT 1 FROM vendor_qa vqa WHERE vqa.evaluation_project_id = ep.id
        )
    LOOP
        vendor_count := 0;

        -- For each vendor in this project
        FOR vendor_rec IN
            SELECT v.id, v.name
            FROM vendors v
            WHERE v.evaluation_project_id = eval_project.id
            LIMIT 5  -- Limit to first 5 vendors
        LOOP
            vendor_count := vendor_count + 1;

            -- Pending question
            INSERT INTO vendor_qa (
                evaluation_project_id, vendor_id, question_text, question_category,
                question_reference, status, submitted_at
            ) VALUES (
                eval_project.id, vendor_rec.id,
                'Could you clarify the expected response format for Section 3.2 Technical Requirements? Should we provide detailed architecture diagrams?',
                'Technical',
                'RFP Section 3.2',
                'pending',
                NOW() - INTERVAL '2 days'
            );

            -- In Progress question
            INSERT INTO vendor_qa (
                evaluation_project_id, vendor_id, question_text, question_category,
                question_reference, status, submitted_at
            ) VALUES (
                eval_project.id, vendor_rec.id,
                'Is there flexibility on the proposed implementation timeline of 6 months? Our standard enterprise deployment requires 8-10 months for full integration.',
                'Timeline',
                'RFP Section 5.1',
                'in_progress',
                NOW() - INTERVAL '3 days'
            );

            -- Answered question (shared)
            INSERT INTO vendor_qa (
                evaluation_project_id, vendor_id, question_text, question_category,
                question_reference, status, answer_text, answered_at,
                is_shared, shared_at, anonymized
            ) VALUES (
                eval_project.id, vendor_rec.id,
                'What is the budget range allocated for this project? This will help us tailor our proposal appropriately.',
                'Commercial',
                'RFP Section 7',
                'answered',
                'We cannot disclose the specific budget at this stage. Please provide your best-value proposal based on the requirements outlined. Pricing will be evaluated as one component of the overall assessment.',
                NOW() - INTERVAL '1 day',
                TRUE, NOW() - INTERVAL '1 day', TRUE
            );

            -- Answered question (not shared)
            INSERT INTO vendor_qa (
                evaluation_project_id, vendor_id, question_text, question_category,
                question_reference, status, answer_text, answered_at,
                is_shared
            ) VALUES (
                eval_project.id, vendor_rec.id,
                'Can we schedule a preliminary meeting with the technical team to better understand the current infrastructure before submitting our proposal?',
                'Technical',
                NULL,
                'answered',
                'Yes, we can arrange a 1-hour technical briefing session. Please contact the procurement team to schedule. All vendors will be offered the same opportunity.',
                NOW() - INTERVAL '4 days',
                FALSE
            );

            -- Add additional Q&A for first 2 vendors only
            IF vendor_count <= 2 THEN
                -- Rejected question
                INSERT INTO vendor_qa (
                    evaluation_project_id, vendor_id, question_text, question_category,
                    status, rejection_reason, submitted_at, answered_at
                ) VALUES (
                    eval_project.id, vendor_rec.id,
                    'Can we submit a joint proposal with another vendor who provides complementary services?',
                    'Commercial',
                    'rejected',
                    'Consortium bids are not accepted for this procurement. Each vendor must submit an independent proposal.',
                    NOW() - INTERVAL '5 days',
                    NOW() - INTERVAL '4 days'
                );

                -- Another pending with different category
                INSERT INTO vendor_qa (
                    evaluation_project_id, vendor_id, question_text, question_category,
                    question_reference, status, submitted_at
                ) VALUES (
                    eval_project.id, vendor_rec.id,
                    'Are there specific compliance certifications required beyond SOC 2 mentioned in the RFP? We hold ISO 27001, GDPR, and HIPAA certifications.',
                    'Security',
                    'RFP Section 4.3',
                    'pending',
                    NOW() - INTERVAL '1 day'
                );

                -- Answered with internal notes
                INSERT INTO vendor_qa (
                    evaluation_project_id, vendor_id, question_text, question_category,
                    question_reference, status, answer_text, answered_at,
                    internal_notes, is_shared
                ) VALUES (
                    eval_project.id, vendor_rec.id,
                    'What is the expected contract duration and are there provisions for renewal?',
                    'Legal',
                    'RFP Section 8.1',
                    'answered',
                    'The initial contract term is 3 years with two optional 1-year renewal periods. Contract renewal is subject to satisfactory performance and mutual agreement.',
                    NOW() - INTERVAL '2 days',
                    'Legal team confirmed standard terms apply. No special provisions needed.',
                    FALSE
                );
            END IF;
        END LOOP;

        -- Enable Q&A for this project
        UPDATE evaluation_projects
        SET qa_enabled = TRUE,
            qa_start_date = NOW() - INTERVAL '7 days',
            qa_end_date = NOW() + INTERVAL '14 days'
        WHERE id = eval_project.id;

        RAISE NOTICE 'Seeded vendor Q&A for evaluation project: %', eval_project.id;
    END LOOP;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
DECLARE
    question_count INT;
    qa_count INT;
BEGIN
    SELECT COUNT(*) INTO question_count FROM vendor_questions WHERE is_deleted = FALSE;
    SELECT COUNT(*) INTO qa_count FROM vendor_qa;

    RAISE NOTICE 'Total vendor questions: %', question_count;
    RAISE NOTICE 'Total vendor Q&A items: %', qa_count;
END $$;
