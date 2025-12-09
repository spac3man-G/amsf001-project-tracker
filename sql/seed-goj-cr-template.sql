-- =============================================================================
-- GOJ CHANGE REQUEST TEMPLATE - SEED DATA
-- Insert this template into a project to enable CR document generation
-- =============================================================================
-- 
-- USAGE:
-- 1. Replace 'YOUR_PROJECT_ID_HERE' with your actual project UUID
-- 2. Replace 'YOUR_USER_ID_HERE' with your user UUID (for created_by)
-- 3. Run in Supabase SQL Editor
--
-- To find your project ID:
--   SELECT id, name FROM projects;
--
-- To find your user ID:
--   SELECT id, email FROM profiles;
-- =============================================================================

-- First, let's create a function to make this reusable
CREATE OR REPLACE FUNCTION insert_goj_cr_template(
  p_project_id UUID,
  p_created_by UUID
) RETURNS UUID AS $$
DECLARE
  v_template_id UUID;
BEGIN
  INSERT INTO document_templates (
    project_id,
    name,
    code,
    description,
    version,
    template_type,
    template_definition,
    output_formats,
    default_output_format,
    primary_color,
    secondary_color,
    font_family,
    footer_center,
    is_active,
    is_default,
    is_system,
    created_by
  ) VALUES (
    p_project_id,
    'GOJ Change Request',
    'goj_cr_v1',
    'Government of Jersey Schedule 9 Change Request document for formal variation submissions',
    1,
    'variation_cr',
    '{
      "metadata": {
        "schema_version": "1.0",
        "template_code": "goj_cr_v1",
        "document_title": "Change Request",
        "document_subtitle": "Schedule 9",
        "page_size": "A4",
        "orientation": "portrait",
        "margins": { "top": 20, "right": 20, "bottom": 20, "left": 20 }
      },
      "sections": [
        {
          "type": "header",
          "logo": { "source": "template.logo_base64", "width": 150, "position": "left" },
          "title": { "text": "CHANGE REQUEST", "style": "header_title" },
          "subtitle": { "text": "Schedule 9 - Architectural Managed Services", "style": "header_subtitle" }
        },
        {
          "type": "section_title",
          "text": "1. CHANGE IDENTIFICATION",
          "level": 1,
          "style": "section_heading"
        },
        {
          "type": "field_row",
          "fields": [
            { "id": "change_title", "label": "Title of Change", "source": "variation.title", "width": "70%", "required": true },
            { "id": "cr_number", "label": "CR No.", "source": "variation.variation_ref", "width": "30%", "required": true }
          ]
        },
        {
          "type": "field_row",
          "fields": [
            { "id": "initiator", "label": "Initiator Name", "source": "variation.creator.full_name", "width": "50%" },
            { "id": "agreement", "label": "Agreement No.", "source": "project.contract_reference", "width": "50%" }
          ]
        },
        {
          "type": "field_row",
          "fields": [
            { "id": "date_raised", "label": "Date Raised", "source": "variation.created_at", "format": "date", "width": "100%" }
          ]
        },
        {
          "type": "text_block",
          "id": "summary",
          "label": "Summary of Change Requested",
          "source": "variation.description",
          "style": "text_block"
        },
        {
          "type": "text_block",
          "id": "benefits",
          "label": "Benefits",
          "source": "variation.benefits",
          "style": "text_block"
        },
        {
          "type": "text_block",
          "id": "reason",
          "label": "Reason for Change",
          "source": "variation.reason",
          "style": "text_block"
        },
        {
          "type": "field_row",
          "fields": [
            { "id": "change_type", "label": "Type of Change", "source": "variation.variation_type", "format": "variation_type_label", "width": "40%" },
            { "id": "priority", "label": "Priority (H/M/L)", "source": "variation.priority", "width": "30%" },
            { "id": "date_required", "label": "Date Required", "source": "variation.date_required", "format": "date", "width": "30%" }
          ]
        },
        {
          "type": "section_title",
          "text": "2. TECHNICAL ASSESSMENT",
          "level": 1,
          "style": "section_heading"
        },
        {
          "type": "field_row",
          "fields": [
            { "id": "tech_author", "label": "Technical Author", "source": "variation.creator.full_name", "width": "50%" },
            { "id": "tech_date", "label": "Date", "source": "variation.updated_at", "format": "date", "width": "50%" }
          ]
        },
        {
          "type": "text_block",
          "id": "assumptions",
          "label": "Assumptions",
          "source": "variation.assumptions",
          "style": "text_block"
        },
        {
          "type": "text_block",
          "id": "risks",
          "label": "Risks and Effects on Authority Resources/Services",
          "source": "variation.risks",
          "style": "text_block"
        },
        {
          "type": "section_title",
          "text": "3. COMMERCIAL ASSESSMENT",
          "level": 1,
          "style": "section_heading"
        },
        {
          "type": "text_block",
          "id": "cost_summary",
          "label": "Cost of Changes",
          "source": "variation.cost_summary",
          "style": "text_block"
        },
        {
          "type": "field_row",
          "fields": [
            { "id": "total_cost_impact", "label": "Total Cost Impact", "source": "computed.total_cost_impact", "format": "currency_with_sign", "width": "100%", "style": "highlight_field" }
          ]
        },
        {
          "type": "text_block",
          "id": "impact_charges",
          "label": "Impact on Charges",
          "source": "variation.impact_on_charges",
          "style": "text_block"
        },
        {
          "type": "text_block",
          "id": "impact_service",
          "label": "Impact on Service Levels",
          "source": "variation.impact_on_service_levels",
          "style": "text_block"
        },
        {
          "type": "text_block",
          "id": "contract_changes",
          "label": "Changes to Contract Terms",
          "source": "variation.contract_terms_reference",
          "style": "text_block"
        },
        {
          "type": "section_title",
          "text": "4. IMPLEMENTATION",
          "level": 1,
          "style": "section_heading"
        },
        {
          "type": "text_block",
          "id": "timetable",
          "label": "Implementation Timetable",
          "source": "variation.implementation_timetable",
          "style": "text_block"
        },
        {
          "type": "table",
          "id": "affected_milestones",
          "label": "Affected Milestones",
          "source": "variation.affected_milestones",
          "columns": [
            { "header": "Ref", "source": "ref", "width": "15%" },
            { "header": "Milestone", "source": "name", "width": "35%" },
            { "header": "Original Date", "source": "original_end", "format": "date", "width": "20%" },
            { "header": "New Date", "source": "new_end", "format": "date", "width": "20%" },
            { "header": "Variance", "source": "days_diff", "format": "days_with_sign", "width": "10%" }
          ],
          "emptyMessage": "No milestones affected"
        },
        {
          "type": "page_break"
        },
        {
          "type": "section_title",
          "text": "5. AUTHORISATION",
          "level": 1,
          "style": "section_heading"
        },
        {
          "type": "signature_block",
          "parties": [
            {
              "title": "Authority Authorisation",
              "subtitle": "(Required for all Change Requests)",
              "fields": [
                { "label": "Name", "source": "variation.customer_signer.full_name", "default": "" },
                { "label": "Title", "source": "variation.customer_signer.job_title", "default": "Customer PM" },
                { "label": "Date", "source": "variation.customer_signed_at", "format": "date", "default": "" },
                { "label": "Signature", "type": "signature_line" }
              ]
            },
            {
              "title": "Contractor Authorisation",
              "subtitle": "(Required for all Change Requests)",
              "fields": [
                { "label": "Name", "source": "variation.supplier_signer.full_name", "default": "" },
                { "label": "Title", "source": "variation.supplier_signer.job_title", "default": "Supplier PM" },
                { "label": "Date", "source": "variation.supplier_signed_at", "format": "date", "default": "" },
                { "label": "Signature", "type": "signature_line" }
              ]
            }
          ]
        }
      ],
      "styles": {
        "page": {
          "fontFamily": "Arial",
          "fontSize": 10,
          "lineHeight": 1.4,
          "color": "#1a1a1a"
        },
        "header_title": {
          "fontSize": 18,
          "fontWeight": "bold",
          "color": "#8B0000",
          "textAlign": "center",
          "marginBottom": 5
        },
        "header_subtitle": {
          "fontSize": 12,
          "color": "#666666",
          "textAlign": "center",
          "marginBottom": 20
        },
        "section_heading": {
          "fontSize": 12,
          "fontWeight": "bold",
          "color": "#8B0000",
          "borderBottom": "2px solid #8B0000",
          "paddingBottom": 5,
          "marginTop": 20,
          "marginBottom": 10
        },
        "field_label": {
          "fontSize": 9,
          "fontWeight": "bold",
          "color": "#666666"
        },
        "field_value": {
          "fontSize": 10,
          "color": "#1a1a1a"
        },
        "text_block": {
          "fontSize": 10,
          "lineHeight": 1.4,
          "marginBottom": 10
        },
        "highlight_field": {
          "fontSize": 12,
          "fontWeight": "bold",
          "backgroundColor": "#f5f5f5",
          "padding": 10
        },
        "table_header": {
          "fontSize": 9,
          "fontWeight": "bold",
          "backgroundColor": "#8B0000",
          "color": "#ffffff",
          "padding": 5
        },
        "table_cell": {
          "fontSize": 9,
          "padding": 5,
          "borderBottom": "1px solid #dddddd"
        }
      },
      "formatters": {
        "date": "DD/MM/YYYY",
        "datetime": "DD/MM/YYYY HH:mm",
        "currency": "£{{value|number:2}}",
        "currency_with_sign": "{{value >= 0 ? \"+\" : \"\"}}£{{value|abs|number:2}}",
        "days_with_sign": "{{value >= 0 ? \"+\" : \"\"}}{{value}} days",
        "variation_type_label": {
          "scope_extension": "Scope Extension",
          "scope_reduction": "Scope Reduction",
          "time_extension": "Time Extension",
          "cost_adjustment": "Cost Adjustment",
          "combined": "Combined"
        }
      }
    }'::jsonb,
    ARRAY['html', 'docx', 'pdf'],
    'html',
    '#8B0000',
    '#1a1a1a',
    'Arial',
    'Schedule 9 - Change Request',
    TRUE,
    TRUE,
    FALSE,
    p_created_by
  )
  RETURNING id INTO v_template_id;
  
  RETURN v_template_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- EXAMPLE USAGE:
-- =============================================================================
-- 
-- To insert the template for a specific project, run:
--
-- SELECT insert_goj_cr_template(
--   'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'::uuid,  -- Your project_id
--   'yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy'::uuid   -- Your user_id
-- );
--
-- =============================================================================

-- Optionally, insert for ALL existing projects (uncomment to use):
-- 
-- DO $$
-- DECLARE
--   proj RECORD;
--   admin_user UUID;
-- BEGIN
--   -- Get first admin user
--   SELECT id INTO admin_user FROM profiles LIMIT 1;
--   
--   FOR proj IN SELECT id FROM projects LOOP
--     PERFORM insert_goj_cr_template(proj.id, admin_user);
--     RAISE NOTICE 'Inserted GOJ CR template for project %', proj.id;
--   END LOOP;
-- END $$;

-- =============================================================================
-- VERIFICATION
-- =============================================================================
--
-- After inserting, verify with:
-- 
-- SELECT id, name, code, template_type, is_default 
-- FROM document_templates 
-- WHERE code = 'goj_cr_v1';
--
-- =============================================================================
