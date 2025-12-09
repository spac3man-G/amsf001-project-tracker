# AMSF001 Document Templates System
## Technical Specification & Implementation Guide

**Version:** 1.0  
**Date:** 9 December 2025  
**Author:** Claude AI (with Glenn Nickols)  
**Status:** Approved for Implementation  

---

## Executive Summary

This specification defines a **template-driven document generation system** for the AMSF001 Project Tracker. The system enables automated creation of formal Change Request (CR) documents from Variation data, with support for multiple output formats (HTML preview, DOCX, PDF).

### Key Design Principles

1. **Templates are data, not code** - Stored in database, fully configurable
2. **Project-scoped** - Each project can have its own templates
3. **Import/Export capable** - Templates can be shared across projects
4. **Format-agnostic renderer** - Single engine interprets any template
5. **Extensible** - New document types can be added without code changes

---

## Table of Contents

1. [Use Case: GOJ Change Request](#1-use-case-goj-change-request)
2. [Database Schema](#2-database-schema)
3. [Template Definition Structure](#3-template-definition-structure)
4. [Service Layer Architecture](#4-service-layer-architecture)
5. [UI Components](#5-ui-components)
6. [API Endpoints](#6-api-endpoints)
7. [Data Flow](#7-data-flow)
8. [Variation Form Enhancements](#8-variation-form-enhancements)
9. [Implementation Phases](#9-implementation-phases)
10. [Security & Permissions](#10-security--permissions)
11. [Future Extensibility](#11-future-extensibility)
12. [Appendix A: GOJ CR Template Definition](#appendix-a-goj-cr-template-definition)
13. [Appendix B: Field Mapping Reference](#appendix-b-field-mapping-reference)

---

## 1. Use Case: GOJ Change Request

### Background

The Government of Jersey (GOJ) Architectural Managed Services Framework Agreement requires formal Change Request documents (Schedule 9) for all project variations. These documents must follow a specific format with designated sections for:

- Change identification and summary
- Technical assessment and assumptions
- Risk analysis
- Cost impact breakdown
- Service level impacts
- Formal authorisation signatures

### Current State

Variations are created and managed within the Project Tracker, but generating the formal CR document requires manual copy/paste into Word templates.

### Target State

Users can generate a properly formatted CR document directly from a Variation record with a single click, ready for review and signature.

### User Story

> As a Supplier PM, I want to generate a GOJ-formatted Change Request document from a Variation record so that I can submit formal change requests without manual document creation.

---

## 2. Database Schema

### 2.1 `document_templates` Table

```sql
CREATE TABLE IF NOT EXISTS document_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Ownership & Scope
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Template Identity
  name TEXT NOT NULL,                        -- "GOJ Change Request"
  code TEXT NOT NULL,                        -- "goj_cr_v1"
  description TEXT,                          -- Usage notes
  version INTEGER DEFAULT 1,
  
  -- Template Type
  template_type TEXT NOT NULL CHECK (template_type IN (
    'variation_cr',
    'variation_certificate',
    'invoice',
    'deliverable_certificate',
    'milestone_certificate',
    'custom'
  )),
  
  -- Template Definition (JSONB)
  template_definition JSONB NOT NULL,
  
  -- Output Configuration
  output_formats TEXT[] DEFAULT ARRAY['html', 'docx'],
  default_output_format TEXT DEFAULT 'html',
  
  -- Branding
  logo_base64 TEXT,
  logo_mime_type TEXT,
  primary_color TEXT DEFAULT '#8B0000',
  secondary_color TEXT DEFAULT '#1a1a1a',
  font_family TEXT DEFAULT 'Arial',
  
  -- Header/Footer
  header_left TEXT,
  header_center TEXT,
  header_right TEXT,
  footer_left TEXT,
  footer_center TEXT,
  footer_right TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  is_system BOOLEAN DEFAULT FALSE,
  
  -- Import/Export
  source_project_id UUID,
  source_template_id UUID,
  imported_at TIMESTAMPTZ,
  imported_by UUID REFERENCES profiles(id),
  
  -- Audit
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Soft Delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id),
  
  UNIQUE(project_id, code, version)
);
```

### 2.2 Indexes

```sql
CREATE INDEX idx_document_templates_project ON document_templates(project_id);
CREATE INDEX idx_document_templates_type ON document_templates(template_type);
CREATE INDEX idx_document_templates_active ON document_templates(is_active) 
  WHERE is_active = TRUE AND is_deleted = FALSE;
```

### 2.3 RLS Policies

```sql
-- SELECT: Project members
CREATE POLICY "document_templates_select_policy" ON document_templates 
  FOR SELECT TO authenticated 
  USING (
    is_deleted = FALSE AND
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = document_templates.project_id
      AND up.user_id = auth.uid()
    )
  );

-- INSERT/UPDATE: Admin and Supplier PM only
CREATE POLICY "document_templates_insert_policy" ON document_templates 
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = document_templates.project_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm')
    )
  );

-- DELETE: Admin and Supplier PM (non-system templates only)
CREATE POLICY "document_templates_delete_policy" ON document_templates 
  FOR DELETE TO authenticated 
  USING (
    is_system = FALSE AND
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = document_templates.project_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm')
    )
  );
```

---

## 3. Template Definition Structure

The `template_definition` JSONB column contains the complete template structure.

### 3.1 Top-Level Schema

```json
{
  "metadata": {
    "schema_version": "1.0",
    "template_code": "goj_cr_v1",
    "document_title": "Change Request",
    "page_size": "A4",
    "orientation": "portrait",
    "margins": {
      "top": 20,
      "right": 20,
      "bottom": 20,
      "left": 20
    }
  },
  "sections": [ /* Array of section definitions */ ],
  "styles": { /* Style definitions */ },
  "formatters": { /* Value formatters */ }
}
```

### 3.2 Section Types

| Type | Purpose | Key Properties |
|------|---------|----------------|
| `header` | Document header with logo | logo, title, subtitle |
| `section_title` | Section heading | text, level, style |
| `field_row` | Label-value pair row | fields array |
| `text_block` | Multi-line text area | source, label |
| `table` | Tabular data | columns, rows |
| `signature_block` | Signature area | parties array |
| `page_break` | Force page break | - |

### 3.3 Field Definition

```json
{
  "id": "change_title",
  "label": "Title of Change",
  "source": "variation.title",
  "format": null,
  "width": "70%",
  "required": true,
  "default": ""
}
```

### 3.4 Source Path Resolution

Sources use dot-notation to reference data:

| Source Path | Resolves To |
|-------------|-------------|
| `variation.title` | Variation title field |
| `variation.creator.full_name` | Creator's name from profile |
| `project.name` | Project name |
| `project.contract_reference` | Contract reference number |
| `computed.total_cost_impact` | Calculated value |
| `computed.days_diff` | Calculated days difference |

---

## 4. Service Layer Architecture

### 4.1 `documentTemplates.service.js`

```javascript
/**
 * Document Templates Service
 * 
 * Manages CRUD operations for document templates.
 */

export class DocumentTemplatesService {
  
  // ─────────────────────────────────────────────────────────────
  // CRUD Operations
  // ─────────────────────────────────────────────────────────────

  async getTemplatesForProject(projectId, filters = {}) {
    // Returns templates for a project
    // Filters: template_type, is_active, is_default
  }

  async getTemplateById(templateId) {
    // Returns single template with full definition
  }

  async getDefaultTemplate(projectId, templateType) {
    // Returns the default template for a type
    // Falls back to first active template if no default
  }

  async createTemplate(templateData, userId) {
    // Creates new template
    // Validates structure before insert
    // Sets created_by
  }

  async updateTemplate(templateId, updates, userId) {
    // Updates template
    // Bumps version if definition changes
  }

  async deleteTemplate(templateId, userId) {
    // Soft deletes template
    // Prevents deletion of system templates
  }

  // ─────────────────────────────────────────────────────────────
  // Import/Export
  // ─────────────────────────────────────────────────────────────

  async exportTemplate(templateId) {
    // Returns template as JSON for download
    // Strips IDs and project-specific data
  }

  async importTemplate(projectId, jsonData, userId) {
    // Creates new template from imported JSON
    // Generates new IDs
    // Records source_project_id and source_template_id
  }

  async duplicateTemplate(templateId, targetProjectId, userId) {
    // Copies template to same or different project
    // Generates new code with _copy suffix
  }

  // ─────────────────────────────────────────────────────────────
  // Validation
  // ─────────────────────────────────────────────────────────────

  validateTemplateDefinition(definition) {
    // Validates JSONB structure
    // Returns { valid: boolean, errors: string[] }
  }

  validateFieldSources(definition, templateType) {
    // Checks all source paths are valid for data type
    // Returns warnings for missing optional fields
  }
}
```

### 4.2 `documentRenderer.service.js`

```javascript
/**
 * Document Renderer Service
 * 
 * Generic renderer that interprets template definitions
 * and produces output in various formats.
 */

export class DocumentRendererService {
  
  // ─────────────────────────────────────────────────────────────
  // Main Render Methods
  // ─────────────────────────────────────────────────────────────

  async renderToHtml(template, data) {
    // Renders template to HTML string
    // Used for preview in modal
    // Returns { html: string, warnings: string[] }
  }

  async renderToDocx(template, data) {
    // Renders template to DOCX buffer
    // Uses docx-js library
    // Returns { buffer: Buffer, filename: string }
  }

  async renderToPdf(template, data) {
    // Renders template to PDF buffer
    // Uses puppeteer or html-pdf
    // Returns { buffer: Buffer, filename: string }
  }

  // ─────────────────────────────────────────────────────────────
  // Section Renderers
  // ─────────────────────────────────────────────────────────────

  renderHeader(section, data, format) { }
  renderSectionTitle(section, data, format) { }
  renderFieldRow(section, data, format) { }
  renderTextBlock(section, data, format) { }
  renderTable(section, data, format) { }
  renderSignatureBlock(section, data, format) { }
  renderPageBreak(section, format) { }

  // ─────────────────────────────────────────────────────────────
  // Data Resolution
  // ─────────────────────────────────────────────────────────────

  resolveSource(source, context) {
    // Resolves dot-notation path to value
    // Handles arrays, nested objects, computed values
  }

  computeDerivedValues(templateType, rawData) {
    // Computes values not in raw data
    // e.g., cost_diff, days_diff, formatted totals
  }

  // ─────────────────────────────────────────────────────────────
  // Formatting
  // ─────────────────────────────────────────────────────────────

  formatValue(value, format, formatters) {
    // Applies format to value
    // Supported: date, datetime, currency, currency_with_sign,
    //            days_with_sign, percentage, variation_type_label
  }
}
```

---

## 5. UI Components

### 5.1 `CRDocumentModal.jsx`

Modal for previewing and downloading CR documents from a Variation.

```jsx
/**
 * CR Document Modal
 * 
 * Props:
 * - isOpen: boolean
 * - onClose: () => void
 * - variation: Variation object with full data
 * - project: Project object
 * 
 * Features:
 * - Template selection dropdown
 * - Live HTML preview
 * - Download as DOCX button
 * - Download as PDF button
 * - Print button
 */
```

### 5.2 `TemplateManager.jsx`

Admin component for managing templates (future phase).

```jsx
/**
 * Template Manager
 * 
 * Features:
 * - List project templates
 * - Create/Edit/Delete templates
 * - Import/Export templates
 * - Set default template per type
 * - Preview with sample data
 */
```

### 5.3 Integration Points

| Location | Integration |
|----------|-------------|
| `VariationDetail.jsx` | "Generate CR" button opens modal |
| `VariationsPanel.jsx` | Row action menu includes "Generate CR" |
| `ProjectSettings.jsx` | Link to Template Manager |

---

## 6. API Endpoints

### 6.1 Template Management

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/templates?project_id={id}` | List templates |
| GET | `/api/templates/{id}` | Get single template |
| POST | `/api/templates` | Create template |
| PUT | `/api/templates/{id}` | Update template |
| DELETE | `/api/templates/{id}` | Soft delete template |

### 6.2 Document Generation

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/documents/preview` | Generate HTML preview |
| POST | `/api/documents/generate` | Generate downloadable document |

### 6.3 Import/Export

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/templates/{id}/export` | Export as JSON |
| POST | `/api/templates/import` | Import from JSON |

---

## 7. Data Flow

### 7.1 Document Generation Flow

```
User clicks "Generate CR" on Variation
                │
                ▼
┌─────────────────────────────────────┐
│ Fetch variation data                │
│ (with creator, milestones, etc.)    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Fetch project data                  │
│ (contract_reference, etc.)          │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Get default template for            │
│ template_type = 'variation_cr'      │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Renderer.computeDerivedValues()     │
│ (cost_diff, days_diff, etc.)        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Renderer.renderToHtml()             │
│ - Iterate sections                  │
│ - Resolve sources                   │
│ - Apply formatters                  │
│ - Build HTML string                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Display in modal preview            │
│ User can download DOCX/PDF          │
└─────────────────────────────────────┘
```

### 7.2 Download Flow

```
User clicks "Download DOCX"
           │
           ▼
┌─────────────────────────────────────┐
│ POST /api/documents/generate        │
│ - template_id                       │
│ - data_type: 'variation'            │
│ - data_id: variation.id             │
│ - format: 'docx'                    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Server fetches data                 │
│ Server renders to DOCX              │
│ Returns binary buffer               │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│ Browser downloads file              │
│ Filename: VAR-001-CR.docx           │
└─────────────────────────────────────┘
```

---

## 8. Variation Form Enhancements

### 8.1 New Fields for `variations` Table

```sql
ALTER TABLE variations ADD COLUMN IF NOT EXISTS priority TEXT 
  CHECK (priority IN ('H', 'M', 'L')) DEFAULT 'M';

ALTER TABLE variations ADD COLUMN IF NOT EXISTS date_required DATE;

ALTER TABLE variations ADD COLUMN IF NOT EXISTS benefits TEXT;

ALTER TABLE variations ADD COLUMN IF NOT EXISTS assumptions TEXT;

ALTER TABLE variations ADD COLUMN IF NOT EXISTS risks TEXT;

ALTER TABLE variations ADD COLUMN IF NOT EXISTS cost_summary TEXT;

ALTER TABLE variations ADD COLUMN IF NOT EXISTS impact_on_charges TEXT;

ALTER TABLE variations ADD COLUMN IF NOT EXISTS impact_on_service_levels TEXT;

ALTER TABLE variations ADD COLUMN IF NOT EXISTS implementation_timetable TEXT;
```

### 8.2 Updated Wizard Steps

**Current Steps (5):**
1. Basic Info
2. Milestones
3. Impacts
4. Summary
5. Review & Submit

**New Steps (7):**
1. Basic Info (add priority, date_required, benefits)
2. Milestones
3. Impacts
4. **Assumptions & Risks** (NEW)
5. **Cost & Service Impact** (NEW)
6. Summary
7. Review & Submit

### 8.3 Step 4: Assumptions & Risks

```jsx
<FormSection title="Assumptions">
  <TextArea
    name="assumptions"
    label="Assumptions underlying this change"
    rows={4}
    placeholder="List any assumptions..."
  />
</FormSection>

<FormSection title="Risks & Effects">
  <TextArea
    name="risks"
    label="Risks and effects on Authority resources/services"
    rows={4}
    placeholder="Describe potential risks..."
  />
</FormSection>
```

### 8.4 Step 5: Cost & Service Impact

```jsx
<FormSection title="Cost Summary">
  <TextArea
    name="cost_summary"
    label="Detailed cost breakdown"
    rows={4}
  />
</FormSection>

<FormSection title="Impact on Charges">
  <TextArea
    name="impact_on_charges"
    label="Impact on billing/charges"
    rows={3}
  />
</FormSection>

<FormSection title="Impact on Service Levels">
  <TextArea
    name="impact_on_service_levels"
    label="Impact on SLAs/service levels"
    rows={3}
  />
</FormSection>

<FormSection title="Implementation Timeline">
  <TextArea
    name="implementation_timetable"
    label="Timeline for implementation"
    rows={3}
  />
</FormSection>
```

---

## 9. Implementation Phases

### Phase 1: Database & Foundation (8 hours)

| Task | Hours |
|------|-------|
| Create `document_templates` table | 1 |
| Add RLS policies | 1 |
| Add variation fields | 1 |
| Add project `contract_reference` | 0.5 |
| Create `documentTemplates.service.js` | 2 |
| Unit tests | 2.5 |

### Phase 2: Renderer Engine (16 hours)

| Task | Hours |
|------|-------|
| Create `documentRenderer.service.js` | 4 |
| HTML renderer implementation | 4 |
| DOCX renderer (using docx-js) | 4 |
| PDF renderer (using html-pdf) | 2 |
| Unit tests for renderers | 2 |

### Phase 3: UI Integration (12 hours)

| Task | Hours |
|------|-------|
| Create `CRDocumentModal.jsx` | 4 |
| Integrate with `VariationDetail.jsx` | 2 |
| Preview styling (CSS) | 2 |
| Download functionality | 2 |
| Testing & bug fixes | 2 |

### Phase 4: Variation Form Updates (8 hours)

| Task | Hours |
|------|-------|
| Update wizard steps | 3 |
| Add new form fields | 2 |
| Update variation service | 1 |
| Testing | 2 |

### Phase 5: Template Manager (16 hours) - Future

| Task | Hours |
|------|-------|
| Template list component | 4 |
| Template editor component | 6 |
| Import/Export functionality | 3 |
| Testing | 3 |

### Total Estimated Effort

| Phase | Hours | Priority |
|-------|-------|----------|
| Phase 1: Database | 8 | P1 |
| Phase 2: Renderer | 16 | P1 |
| Phase 3: UI | 12 | P1 |
| Phase 4: Form Updates | 8 | P2 |
| Phase 5: Template Manager | 16 | P3 |
| **Total** | **60** | |

---

## 10. Security & Permissions

### 10.1 Role Matrix

| Action | Admin | Supplier PM | Customer PM | Contributor |
|--------|-------|-------------|-------------|-------------|
| View templates | ✅ | ✅ | ✅ | ✅ |
| Create templates | ✅ | ✅ | ❌ | ❌ |
| Edit templates | ✅ | ✅ | ❌ | ❌ |
| Delete templates | ✅ | ✅ | ❌ | ❌ |
| Import templates | ✅ | ✅ | ❌ | ❌ |
| Export templates | ✅ | ✅ | ✅ | ❌ |
| Generate documents | ✅ | ✅ | ✅ | ✅ |

### 10.2 Data Security

- Templates are project-scoped (RLS enforced)
- Logo images stored as base64 in database
- No external file references
- Generated documents contain no credentials

---

## 11. Future Extensibility

### 11.1 Additional Template Types

| Type | Data Source | Use Case |
|------|-------------|----------|
| `variation_certificate` | Variation | Completion certificate |
| `invoice` | Partner Invoice | Formal invoice |
| `deliverable_certificate` | Deliverable | Sign-off document |
| `milestone_certificate` | Milestone | Completion document |
| `custom` | Any | User-defined |

### 11.2 Template Versioning

- Each template has a `version` field
- Updates to definition bump version
- Historical versions can be retained
- Documents record which template version used

### 11.3 Conditional Sections

Future enhancement to show/hide sections based on data:

```json
{
  "type": "section_title",
  "text": "Affected Milestones",
  "condition": {
    "source": "variation.affected_milestones",
    "operator": "not_empty"
  }
}
```

### 11.4 Multi-Language Support

Template definitions could support multiple languages:

```json
{
  "label": {
    "en": "Title of Change",
    "fr": "Titre du Changement"
  }
}
```

---

## Appendix A: GOJ CR Template Definition

Complete JSONB template definition for GOJ Change Request:

```json
{
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
    "currency_with_sign": "{{value >= 0 ? '+' : ''}}£{{value|abs|number:2}}",
    "days_with_sign": "{{value >= 0 ? '+' : ''}}{{value}} days",
    "variation_type_label": {
      "scope_extension": "Scope Extension",
      "scope_reduction": "Scope Reduction",
      "time_extension": "Time Extension",
      "cost_adjustment": "Cost Adjustment",
      "combined": "Combined"
    }
  }
}
```

---

## Appendix B: Field Mapping Reference

| CR Field | Source Path | Format | Required | Notes |
|----------|-------------|--------|----------|-------|
| Title of Change | `variation.title` | - | Yes | |
| Change Request No | `variation.variation_ref` | - | Yes | Auto-generated |
| Initiator Name | `variation.creator.full_name` | - | Yes | Profile lookup |
| Agreement No | `project.contract_reference` | - | No | New project field |
| Date Raised | `variation.created_at` | date | Yes | |
| Summary | `variation.description` | - | No | |
| Benefits | `variation.benefits` | - | No | **New field** |
| Reason for Change | `variation.reason` | - | No | |
| Type of Change | `variation.variation_type` | variation_type_label | Yes | |
| Priority | `variation.priority` | - | Yes | **New field** |
| Date Required | `variation.date_required` | date | No | **New field** |
| Technical Author | `variation.creator.full_name` | - | Yes | |
| Technical Date | `variation.updated_at` | date | Yes | |
| Assumptions | `variation.assumptions` | - | No | **New field** |
| Risks | `variation.risks` | - | No | **New field** |
| Cost of Changes | `variation.cost_summary` | - | No | **New field** |
| Total Cost Impact | `computed.total_cost_impact` | currency_with_sign | Yes | Calculated |
| Impact on Charges | `variation.impact_on_charges` | - | No | **New field** |
| Impact on Service | `variation.impact_on_service_levels` | - | No | **New field** |
| Contract Changes | `variation.contract_terms_reference` | - | No | Existing field |
| Implementation Timeline | `variation.implementation_timetable` | - | No | **New field** |
| Affected Milestones | `variation.affected_milestones` | table | No | Array |
| Authority Name | `variation.customer_signer.full_name` | - | Conditional | |
| Authority Date | `variation.customer_signed_at` | date | Conditional | |
| Contractor Name | `variation.supplier_signer.full_name` | - | Conditional | |
| Contractor Date | `variation.supplier_signed_at` | date | Conditional | |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 9 Dec 2025 | Claude AI | Initial specification |

---

*End of Specification*
