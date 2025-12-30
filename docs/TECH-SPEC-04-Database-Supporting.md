# AMSF001 Technical Specification - Database Supporting Tables

**Document:** TECH-SPEC-04-Database-Supporting.md  
**Version:** 1.2  
**Date:** 10 December 2025  
**Updated:** 28 December 2025  
**Session:** 1.4.1  
**Status:** Complete  

> **Version 1.2 Updates (28 December 2025):**
> - Added `benchmark_rates` table (Section 11) - SFIA 8 rate card
> - This is **global data** (not project-scoped)
> - Updated Table of Contents and Document History
>
> **Version 1.1 Updates (23 December 2025):**
> - Added note about organisation context inheritance
> - Added Document History section
> - No schema changes - supporting tables inherit org context via project_id

---

## Table of Contents

1. [Overview](#overview)
2. [KPIs Table](#kpis-table)
3. [Quality Standards Table](#quality-standards-table)
4. [RAID Items Table](#raid-items-table)
5. [Variations System](#variations-system)
   - [Variations Table](#variations-table)
   - [Variation Milestones Table](#variation-milestones-table)
   - [Variation Deliverables Table](#variation-deliverables-table)
   - [Milestone Baseline Versions Table](#milestone-baseline-versions-table)
6. [Document Templates Table](#document-templates-table)
7. [Audit Log Table](#audit-log-table)
8. [Soft Delete Infrastructure](#soft-delete-infrastructure)
9. [Supporting Views](#supporting-views)
10. [Relationships and Dependencies](#relationships-and-dependencies)
11. [Benchmark Rates Table (Global)](#benchmark-rates-table-global)

---

## Overview

This document details the supporting tables that provide essential project management capabilities beyond the core operational entities. These tables enable:

- **Performance Tracking**: KPIs and quality standards monitoring
- **Risk Management**: RAID log for project governance
- **Change Control**: Variations system for formal change management
- **Document Generation**: Template-driven document creation
- **Audit Trail**: Comprehensive change tracking
- **Data Recovery**: Soft delete with recovery capability

> **Organisation Context (December 2025):** All supporting tables in this document are Tier 3 entities in the three-tier multi-tenancy model. They reference `project_id`, and inherit organisation context through the project's `organisation_id` foreign key. RLS policies use the `can_access_project()` helper function which checks both project membership and organisation admin status. See TECH-SPEC-02-Database-Core.md for the organisation layer.

### Supporting Tables Architecture

```
Supporting Layer
├── Metrics & Quality
│   ├── kpis (Performance indicators)
│   └── quality_standards (Quality compliance)
├── Governance
│   └── raid_items (Risks, Assumptions, Issues, Dependencies)
├── Change Control
│   ├── variations (Change requests)
│   ├── variation_milestones (Milestone impacts)
│   ├── variation_deliverables (Deliverable changes)
│   └── milestone_baseline_versions (Historical baselines)
├── Document Management
│   └── document_templates (Template definitions)
└── System Infrastructure
    ├── audit_log (Change tracking)
    └── Soft delete columns (All main tables)
```

---

## KPIs Table

### Purpose
Tracks Key Performance Indicators for measuring project success against defined targets.

### Table Structure

```sql
CREATE TABLE kpis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Identification
  kpi_ref TEXT NOT NULL,                  -- e.g., KPI-001, KPI-002
  name TEXT NOT NULL,                     -- KPI name
  category TEXT,                          -- Grouping (e.g., 'Quality', 'Time', 'Cost')
  
  -- Measurement
  target_value DECIMAL(5,2),              -- Target value to achieve
  actual_value DECIMAL(5,2),              -- Current actual value
  unit TEXT DEFAULT 'percent',            -- Measurement unit
  
  -- Trending
  trend TEXT,                             -- 'higher_better' or 'lower_better'
  threshold_amber DECIMAL(5,2),           -- Amber threshold percentage
  
  -- Status tracking
  last_updated TIMESTAMPTZ,               -- When last measured
  comments TEXT,                          -- Notes on measurement
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Soft delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  
  UNIQUE(project_id, kpi_ref)
);
```

### Key Features

#### 1. RAG Status Calculation
KPIs automatically calculate Red/Amber/Green status based on:
- Target value
- Actual value
- Trend direction (higher_better vs lower_better)
- Amber threshold

```javascript
// From kpis.service.js
calculateRAG(kpi) {
  const actual = parseFloat(kpi.actual_value);
  const target = parseFloat(kpi.target_value);
  const threshold = parseFloat(kpi.threshold_amber || 10);

  if (kpi.trend === 'higher_better') {
    if (actual >= target) return 'Green';
    if (actual >= target * (1 - threshold / 100)) return 'Amber';
    return 'Red';
  } else {
    if (actual <= target) return 'Green';
    if (actual <= target * (1 + threshold / 100)) return 'Amber';
    return 'Red';
  }
}
```

#### 2. Deliverable Integration
KPIs can be assessed through deliverables via the `deliverable_kpi_assessments` table:
- Only assessments from valid deliverables count (not deleted + correct status)
- Uses centralized `VALID_STATUSES` configuration
- Provides calculated achievement percentages

### Indexes

```sql
CREATE INDEX idx_kpis_project_id ON kpis(project_id);
CREATE INDEX idx_kpis_active ON kpis(project_id, name) 
  WHERE is_deleted = FALSE OR is_deleted IS NULL;
```

### RLS Policies

```sql
-- SELECT: Any user with project access
CREATE POLICY "kpis_select_policy" ON kpis 
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = kpis.project_id
      AND up.user_id = auth.uid()
    )
  );

-- INSERT/UPDATE: Admin and Supplier PM only
CREATE POLICY "kpis_insert_policy" ON kpis 
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = kpis.project_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm')
    )
  );

-- DELETE: Admin only
CREATE POLICY "kpis_delete_policy" ON kpis 
  FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = kpis.project_id
      AND up.user_id = auth.uid()
      AND up.role = 'admin'
    )
  );
```

### Service Layer Operations

```javascript
// KPIsService methods
- getAllWithStatus(projectId)          // Get all KPIs with RAG status
- getByRAGStatus(projectId, ragStatus) // Filter by Red/Amber/Green
- getNeedingAttention(projectId)       // Get Amber + Red KPIs
- updateActualValue(kpiId, value)      // Update measurement
- getSummary(projectId)                // Get counts by RAG status
- getAssessments(projectId)            // Get deliverable assessments
```

---

## Quality Standards Table

### Purpose
Defines quality standards and tracks compliance through deliverable assessments.

### Table Structure

```sql
CREATE TABLE quality_standards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Identification
  qs_ref TEXT NOT NULL,                   -- e.g., QS-001, QS-002
  name TEXT NOT NULL,                     -- Standard name
  description TEXT,                       -- Full description
  
  -- Measurement
  target_value DECIMAL(5,2),              -- Target compliance percentage
  actual_value DECIMAL(5,2),              -- Current compliance
  target INTEGER DEFAULT 100,             -- Target percentage (for calculated)
  
  -- Documentation
  measurement_notes TEXT,                 -- How to measure
  expected_outcome TEXT,                  -- Expected results
  
  -- Tracking
  last_measured TIMESTAMPTZ,              -- Last assessment date
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Soft delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  
  UNIQUE(project_id, qs_ref)
);
```

### Key Features

#### 1. Compliance Status Calculation
Quality standards calculate compliance status based on actual vs target:

```javascript
// From qualityStandards.service.js
calculateCompliance(standard) {
  if (standard.actual_value === null) {
    return 'Not Measured';
  }

  const actual = parseFloat(standard.actual_value);
  const target = parseFloat(standard.target_value || 0);

  if (actual >= target) return 'Compliant';
  if (actual >= target * 0.9) return 'Near Compliant';
  return 'Non-Compliant';
}
```

#### 2. Deliverable Assessment Integration
Quality standards are assessed through deliverables via `deliverable_qs_assessments`:
- Each deliverable can assess whether it meets each quality standard
- Calculated compliance based on percentage of deliverables meeting criteria
- Only counts valid deliverables (not deleted + correct status)

### Indexes

```sql
CREATE INDEX idx_quality_standards_project_id ON quality_standards(project_id);
CREATE INDEX idx_quality_standards_active ON quality_standards(project_id, name) 
  WHERE is_deleted = FALSE OR is_deleted IS NULL;
```

### RLS Policies

Similar to KPIs:
- SELECT: All project members
- INSERT/UPDATE: Admin and Supplier PM
- DELETE: Admin only

### Service Layer Operations

```javascript
// QualityStandardsService methods
- getAllWithStatus(projectId)              // Get all with compliance status
- getNonCompliant(projectId)               // Get non-compliant standards
- updateMeasurement(id, value, notes)      // Update measurement
- getSummary(projectId)                    // Get compliance summary
- getAssessments(projectId)                // Get deliverable assessments
- getAllWithCalculatedValues(projectId)    // Get with calculated compliance
```

---

## RAID Items Table

### Purpose
Tracks Risks, Assumptions, Issues, and Dependencies for project governance.

### Table Structure

```sql
CREATE TABLE raid_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Identification
  raid_ref TEXT NOT NULL,                    -- R001, A001, I001, D001
  category TEXT NOT NULL CHECK (category IN ('Risk', 'Assumption', 'Issue', 'Dependency')),
  title TEXT,                                -- Short title
  description TEXT NOT NULL,                 -- Full description
  
  -- Assessment
  impact TEXT,                               -- Impact if realised
  probability TEXT CHECK (probability IN ('Low', 'Medium', 'High')),
  severity TEXT CHECK (severity IN ('Low', 'Medium', 'High')),
  mitigation TEXT,                           -- Mitigation strategy
  
  -- Management
  status TEXT DEFAULT 'Open' CHECK (status IN (
    'Open', 'In Progress', 'Closed', 'Accepted', 'Mitigated'
  )),
  owner_id UUID REFERENCES resources(id),    -- Responsible resource
  due_date DATE,                             -- Target resolution date
  milestone_id UUID REFERENCES milestones(id),
  
  -- Tracking
  raised_date DATE DEFAULT CURRENT_DATE,
  closed_date DATE,
  resolution TEXT,                           -- How resolved
  source TEXT,                               -- Origin (e.g., 'SoW v2.61')
  
  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Soft delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id),
  
  UNIQUE(project_id, raid_ref)
);
```

### Key Features

#### 1. Four Category Types
- **Risk**: Potential future problems
- **Assumption**: Conditions assumed to be true
- **Issue**: Current problems requiring resolution
- **Dependency**: External factors affecting the project

#### 2. Risk Assessment Matrix
- Probability: Low / Medium / High
- Severity: Low / Medium / High
- Impact description
- Mitigation strategy

#### 3. Ownership and Tracking
- Assigned to specific resources
- Linked to milestones when relevant
- Status workflow from Open → In Progress → Closed/Mitigated
- Resolution tracking

### Indexes

```sql
CREATE INDEX idx_raid_items_project_id ON raid_items(project_id);
CREATE INDEX idx_raid_items_category ON raid_items(category);
CREATE INDEX idx_raid_items_status ON raid_items(status);
CREATE INDEX idx_raid_items_owner_id ON raid_items(owner_id);
CREATE INDEX idx_raid_items_milestone_id ON raid_items(milestone_id);
CREATE INDEX idx_raid_items_is_deleted ON raid_items(is_deleted);

-- Composite index for common queries
CREATE INDEX idx_raid_items_project_category_status 
  ON raid_items(project_id, category, status) 
  WHERE is_deleted = FALSE;
```

### RLS Policies

```sql
-- SELECT: All project members
CREATE POLICY "raid_items_select_policy" ON raid_items 
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = raid_items.project_id
      AND up.user_id = auth.uid()
    )
  );

-- INSERT: All except viewers
CREATE POLICY "raid_items_insert_policy" ON raid_items 
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = raid_items.project_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm', 'customer_pm', 'contributor')
    )
  );

-- UPDATE: Owner or Admin/Supplier PM
CREATE POLICY "raid_items_update_policy" ON raid_items 
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = raid_items.project_id
      AND up.user_id = auth.uid()
      AND (
        up.role IN ('admin', 'supplier_pm')
        OR raid_items.created_by = auth.uid()
      )
    )
  );

-- DELETE: Admin only
CREATE POLICY "raid_items_delete_policy" ON raid_items 
  FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = raid_items.project_id
      AND up.user_id = auth.uid()
      AND up.role = 'admin'
    )
  );
```

### Supporting Views

```sql
-- Active RAID items (non-deleted with joins)
CREATE OR REPLACE VIEW active_raid_items AS
SELECT 
  ri.*,
  r.name as owner_name,
  m.name as milestone_name,
  m.milestone_ref
FROM raid_items ri
LEFT JOIN resources r ON ri.owner_id = r.id
LEFT JOIN milestones m ON ri.milestone_id = m.id
WHERE ri.is_deleted = FALSE;

-- RAID summary for dashboard
CREATE OR REPLACE VIEW raid_summary AS
SELECT 
  project_id,
  category,
  status,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE severity = 'High') as high_severity_count,
  COUNT(*) FILTER (WHERE probability = 'High') as high_probability_count
FROM raid_items
WHERE is_deleted = FALSE
GROUP BY project_id, category, status;
```

---

## Variations System

The variations system implements formal change control for project scope, schedule, and cost changes. It consists of four interconnected tables.

### Variations Table

#### Purpose
Main table for variation requests (change requests) with dual-signature approval workflow.

#### Table Structure

```sql
CREATE TABLE variations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Reference and identification
  variation_ref TEXT NOT NULL,            -- VAR-001, VAR-002
  title TEXT NOT NULL,
  
  -- Type and description
  variation_type TEXT NOT NULL CHECK (variation_type IN (
    'scope_extension', 
    'scope_reduction', 
    'time_extension', 
    'cost_adjustment', 
    'combined'
  )),
  description TEXT,
  reason TEXT,
  contract_terms_reference TEXT,
  
  -- Workflow status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'submitted', 
    'awaiting_customer',
    'awaiting_supplier',
    'approved',
    'applied',
    'rejected'
  )),
  
  -- Multi-step form state
  form_step INTEGER DEFAULT 1,            -- Current wizard step (1-5)
  form_data JSONB,                        -- Complete form state for draft restoration
  
  -- Impact summary
  impact_summary TEXT,                    -- AI-generated and edited summary
  total_cost_impact DECIMAL(12,2) DEFAULT 0,
  total_days_impact INTEGER DEFAULT 0,
  
  -- Change Request document fields (P16)
  priority TEXT CHECK (priority IN ('H', 'M', 'L')) DEFAULT 'M',
  date_required DATE,
  benefits TEXT,
  assumptions TEXT,
  risks TEXT,
  cost_summary TEXT,
  impact_on_charges TEXT,
  impact_on_service_levels TEXT,
  implementation_timetable TEXT,
  
  -- Supplier PM signature
  supplier_signed_by UUID REFERENCES profiles(id),
  supplier_signed_at TIMESTAMPTZ,
  
  -- Customer PM signature
  customer_signed_by UUID REFERENCES profiles(id),
  customer_signed_at TIMESTAMPTZ,
  
  -- Rejection info
  rejected_by UUID REFERENCES profiles(id),
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Application tracking
  applied_at TIMESTAMPTZ,                 -- When applied to baselines
  
  -- Certificate generation
  certificate_number TEXT,                -- AMSF001-VAR-001-CERT
  certificate_data JSONB,                 -- Complete certificate data
  
  -- Audit fields
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Soft delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id),
  
  UNIQUE(project_id, variation_ref)
);
```

#### Key Features

##### 1. Multi-Step Wizard Form
- **form_step**: Tracks current step (1-5) in creation wizard
- **form_data**: Stores complete JSONB state for draft restoration
- Enables users to save progress and return later

##### 2. Variation Types
- **scope_extension**: Adding work or deliverables
- **scope_reduction**: Removing work or deliverables
- **time_extension**: Schedule changes
- **cost_adjustment**: Budget changes
- **combined**: Multiple impact types

##### 3. Workflow States
```
draft → submitted → awaiting_customer/awaiting_supplier → approved → applied
                                                        ↓
                                                     rejected
```

##### 4. Dual-Signature Approval
- Requires both Supplier PM and Customer PM signatures
- Tracks who signed and when
- Either party can sign first, both required for approval

##### 5. Certificate Generation
- Auto-generates change request certificate on approval
- Stores certificate data in JSONB for regeneration
- Unique certificate number per variation

#### Indexes

```sql
CREATE INDEX idx_variations_project_id ON variations(project_id);
CREATE INDEX idx_variations_status ON variations(status);
CREATE INDEX idx_variations_created_at ON variations(created_at DESC);
```

#### RLS Policies

```sql
-- SELECT: All project members
CREATE POLICY "variations_select_policy" ON variations 
  FOR SELECT TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = variations.project_id
      AND up.user_id = auth.uid()
    )
  );

-- INSERT: Admin and Supplier PM only
CREATE POLICY "variations_insert_policy" ON variations 
  FOR INSERT TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = variations.project_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm')
    )
  );

-- UPDATE: Admin, Supplier PM, and Customer PM (for signing)
CREATE POLICY "variations_update_policy" ON variations 
  FOR UPDATE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = variations.project_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm', 'customer_pm')
    )
  );

-- DELETE: Admin and Supplier PM (with rules)
CREATE POLICY "variations_delete_policy" ON variations 
  FOR DELETE TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM user_projects up
      WHERE up.project_id = variations.project_id
      AND up.user_id = auth.uid()
      AND up.role IN ('admin', 'supplier_pm')
    )
  );
```

#### Helper Functions

```sql
-- Generate next variation reference
CREATE OR REPLACE FUNCTION generate_variation_ref(p_project_id UUID)
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(variation_ref FROM 'VAR-(\d+)') AS INTEGER)
  ), 0) + 1 INTO next_num
  FROM variations
  WHERE project_id = p_project_id;
  
  RETURN 'VAR-' || LPAD(next_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;
```

---

### Variation Milestones Table

#### Purpose
Links variations to affected milestones with before/after baseline values.

#### Table Structure

```sql
CREATE TABLE variation_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variation_id UUID NOT NULL REFERENCES variations(id) ON DELETE CASCADE,
  
  -- Existing milestone reference (NULL if creating new)
  milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
  
  -- New milestone creation
  is_new_milestone BOOLEAN DEFAULT FALSE,
  new_milestone_data JSONB,               -- Data for creating new milestone
  
  -- Baseline version tracking
  baseline_version_before INTEGER,        -- Version before variation
  baseline_version_after INTEGER,         -- Version after variation
  
  -- Cost impact
  original_baseline_cost DECIMAL(12,2),
  new_baseline_cost DECIMAL(12,2),
  
  -- Date impact
  original_baseline_start DATE,
  new_baseline_start DATE,
  original_baseline_end DATE,
  new_baseline_end DATE,
  
  -- Rationale
  change_rationale TEXT,                  -- Why this milestone is affected
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Key Features

##### 1. Milestone Impact Tracking
- Tracks original and new values for:
  - Baseline costs
  - Start dates
  - End dates
- Calculates impact automatically

##### 2. New Milestone Creation
- Can create new milestones as part of variation
- **is_new_milestone**: Flag for new vs existing
- **new_milestone_data**: Complete milestone definition in JSONB

##### 3. Version Tracking
- Links to milestone_baseline_versions table
- Maintains version history
- Enables rollback if needed

#### Indexes

```sql
CREATE INDEX idx_variation_milestones_variation_id ON variation_milestones(variation_id);
CREATE INDEX idx_variation_milestones_milestone_id ON variation_milestones(milestone_id);
```

---

### Variation Deliverables Table

#### Purpose
Tracks deliverable changes (add/remove/modify) within variations.

#### Table Structure

```sql
CREATE TABLE variation_deliverables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variation_id UUID NOT NULL REFERENCES variations(id) ON DELETE CASCADE,
  variation_milestone_id UUID REFERENCES variation_milestones(id) ON DELETE CASCADE,
  
  -- Change type
  change_type TEXT NOT NULL CHECK (change_type IN ('add', 'remove', 'modify')),
  
  -- Existing deliverable reference (NULL if adding new)
  deliverable_id UUID REFERENCES deliverables(id) ON DELETE SET NULL,
  
  -- Data snapshots
  original_data JSONB,                    -- Snapshot for modify/remove
  new_data JSONB,                         -- Data for add/modify
  
  -- For removals
  removal_reason TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Key Features

##### 1. Three Change Types
- **add**: Create new deliverable
  - new_data contains full deliverable definition
  - deliverable_id is NULL
- **remove**: Delete existing deliverable
  - original_data contains snapshot before removal
  - removal_reason explains why
- **modify**: Change existing deliverable
  - original_data contains before state
  - new_data contains after state

##### 2. JSONB Data Snapshots
- Preserves complete deliverable state
- Enables comparison and rollback
- Supports audit trail

#### Indexes

```sql
CREATE INDEX idx_variation_deliverables_variation_id ON variation_deliverables(variation_id);
```

---

### Milestone Baseline Versions Table

#### Purpose
Maintains version history of milestone baselines as variations are applied.

#### Table Structure

```sql
CREATE TABLE milestone_baseline_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
  
  -- Version info
  version INTEGER NOT NULL DEFAULT 1,     -- 1 = original, 2+ = variations
  variation_id UUID REFERENCES variations(id) ON DELETE SET NULL,  -- NULL for v1
  
  -- Baseline values at this version
  baseline_start_date DATE,
  baseline_end_date DATE,
  baseline_billable DECIMAL(12,2),
  
  -- Signatures for this version
  supplier_signed_by UUID REFERENCES profiles(id),
  supplier_signed_at TIMESTAMPTZ,
  customer_signed_by UUID REFERENCES profiles(id),
  customer_signed_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(milestone_id, version)
);
```

#### Key Features

##### 1. Version History
- Version 1 = Original baseline (variation_id is NULL)
- Version 2+ = After each approved variation
- Maintains complete history

##### 2. Baseline Snapshot
- Stores baseline values at point in time:
  - Start date
  - End date
  - Billable amount

##### 3. Signature Preservation
- Preserves who signed each version
- Maintains audit trail of approvals

#### Helper Function

```sql
-- Get current baseline version for a milestone
CREATE OR REPLACE FUNCTION get_current_baseline_version(p_milestone_id UUID)
RETURNS INTEGER AS $$
DECLARE
  current_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version), 0) INTO current_version
  FROM milestone_baseline_versions
  WHERE milestone_id = p_milestone_id;
  
  RETURN current_version;
END;
$$ LANGUAGE plpgsql;
```

#### Indexes

```sql
CREATE INDEX idx_milestone_baseline_versions_milestone_id 
  ON milestone_baseline_versions(milestone_id);
```

---

## Document Templates Table

### Purpose
Stores configurable document templates for automated generation of project documents (Change Requests, certificates, invoices).

### Table Structure

```sql
CREATE TABLE document_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Ownership
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Template Identity
  name TEXT NOT NULL,                     -- e.g., "GOJ Change Request"
  code TEXT NOT NULL,                     -- e.g., "goj_cr_v1"
  description TEXT,
  version INTEGER DEFAULT 1,
  
  -- Template Type
  template_type TEXT NOT NULL CHECK (template_type IN (
    'variation_cr',           -- Change Request from variation data
    'variation_certificate',  -- Variation completion certificate
    'invoice',                -- Partner invoice
    'deliverable_certificate',-- Deliverable sign-off
    'milestone_certificate',  -- Milestone completion
    'custom'                  -- User-defined template
  )),
  
  -- Template Definition (CORE STRUCTURE)
  template_definition JSONB NOT NULL,     -- Complete template structure
  
  -- Output Configuration
  output_formats TEXT[] DEFAULT ARRAY['html', 'docx'],
  default_output_format TEXT DEFAULT 'html',
  
  -- Branding & Styling
  logo_base64 TEXT,                       -- Embedded logo (base64)
  logo_mime_type TEXT,                    -- e.g., 'image/png'
  primary_color TEXT DEFAULT '#8B0000',   -- Brand color (hex)
  secondary_color TEXT DEFAULT '#1a1a1a',
  font_family TEXT DEFAULT 'Arial',
  
  -- Header/Footer Configuration
  header_left TEXT,
  header_center TEXT,
  header_right TEXT,
  footer_left TEXT,
  footer_center TEXT,
  footer_right TEXT,
  
  -- Status Flags
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  is_system BOOLEAN DEFAULT FALSE,        -- Protected system templates
  
  -- Import/Export Support
  source_project_id UUID,
  source_template_id UUID,
  imported_at TIMESTAMPTZ,
  imported_by UUID REFERENCES profiles(id),
  
  -- Audit Fields
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

### Key Features

#### 1. Template Definition Structure
The `template_definition` JSONB contains the complete template structure:

```json
{
  "sections": [
    {
      "id": "section_1",
      "title": "Change Request Details",
      "fields": [
        {
          "label": "Variation Reference",
          "mapping": "variation.variation_ref",
          "type": "text"
        },
        {
          "label": "Priority",
          "mapping": "variation.priority",
          "type": "badge"
        }
      ]
    }
  ],
  "formatting": {
    "pageSize": "A4",
    "margins": { "top": 20, "right": 20, "bottom": 20, "left": 20 }
  }
}
```

#### 2. Template Types
- **variation_cr**: Change Request documents
- **variation_certificate**: Variation completion certificates
- **invoice**: Partner invoices
- **deliverable_certificate**: Deliverable sign-off documents
- **milestone_certificate**: Milestone completion certificates
- **custom**: User-defined templates

#### 3. Branding Configuration
- Logo embedding (base64)
- Primary and secondary colors
- Font family
- Header/footer templates with variable substitution

#### 4. Import/Export
- Templates can be exported from one project
- Imported into another project
- Tracks source project and template ID

### Indexes

```sql
CREATE INDEX idx_document_templates_project ON document_templates(project_id);
CREATE INDEX idx_document_templates_type ON document_templates(template_type);
CREATE INDEX idx_document_templates_active ON document_templates(is_active) 
  WHERE is_active = TRUE AND is_deleted = FALSE;
```

### RLS Policies

```sql
-- SELECT: Any project member
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

-- DELETE: Admin and Supplier PM (but not system templates)
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

## Audit Log Table

### Purpose
Automatically tracks all changes to main entities for compliance, debugging, and audit trails.

### Table Structure

```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What was changed
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'RESTORE')),
  
  -- Change details
  old_data JSONB,                         -- Before state
  new_data JSONB,                         -- After state
  changed_fields TEXT[],                  -- Array of changed field names
  
  -- Who and when
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Context
  project_id UUID
);
```

### Key Features

#### 1. Automatic Trigger-Based Logging
A generic trigger function captures all changes:

```sql
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  audit_action TEXT;
  old_data_json JSONB;
  new_data_json JSONB;
  changed_fields_arr TEXT[];
  record_project_id UUID;
  current_user_id UUID;
  current_user_email TEXT;
BEGIN
  -- Get current user info
  current_user_id := auth.uid();
  SELECT email INTO current_user_email FROM auth.users WHERE id = current_user_id;

  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    audit_action := 'INSERT';
    new_data_json := to_jsonb(NEW);
    
  ELSIF TG_OP = 'UPDATE' THEN
    old_data_json := to_jsonb(OLD);
    new_data_json := to_jsonb(NEW);
    
    -- Detect changed fields
    changed_fields_arr := ARRAY(
      SELECT key 
      FROM jsonb_each(old_data_json) AS o(key, value)
      WHERE NOT (new_data_json->key IS NOT DISTINCT FROM o.value)
    );
    
    -- Detect soft delete vs restore vs regular update
    IF OLD.is_deleted IS DISTINCT FROM NEW.is_deleted THEN
      IF NEW.is_deleted = TRUE THEN
        audit_action := 'SOFT_DELETE';
      ELSE
        audit_action := 'RESTORE';
      END IF;
    ELSE
      audit_action := 'UPDATE';
    END IF;
    
  ELSIF TG_OP = 'DELETE' THEN
    audit_action := 'DELETE';
    old_data_json := to_jsonb(OLD);
  END IF;

  -- Insert audit record
  INSERT INTO audit_log (
    table_name, record_id, action, old_data, new_data,
    changed_fields, user_id, user_email, project_id
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    audit_action,
    old_data_json,
    new_data_json,
    changed_fields_arr,
    current_user_id,
    current_user_email,
    record_project_id
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 2. Audited Tables
Triggers are installed on:
- timesheets
- expenses
- resources
- partners
- milestones
- deliverables
- kpis
- quality_standards
- partner_invoices

#### 3. Action Types
- **INSERT**: New record created
- **UPDATE**: Record modified
- **DELETE**: Hard delete
- **SOFT_DELETE**: Record marked as deleted (is_deleted set to TRUE)
- **RESTORE**: Soft-deleted record restored

#### 4. Changed Fields Array
For UPDATE actions, the `changed_fields` array lists exactly which columns were modified, enabling precise audit trails.

### Indexes

```sql
CREATE INDEX idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_project_created ON audit_log(project_id, created_at DESC);
CREATE INDEX idx_audit_log_user_created ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_action ON audit_log(action, created_at DESC);
```

### Supporting Views

```sql
-- Recent audit activity with descriptions
CREATE OR REPLACE VIEW recent_audit_activity AS
SELECT 
  al.id,
  al.table_name,
  al.record_id,
  al.action,
  al.changed_fields,
  al.user_email,
  al.project_id,
  al.created_at,
  CASE 
    WHEN al.action = 'INSERT' THEN 'Created ' || al.table_name
    WHEN al.action = 'UPDATE' THEN 
      'Updated ' || al.table_name || ' (' || array_to_string(al.changed_fields, ', ') || ')'
    WHEN al.action = 'DELETE' THEN 'Deleted ' || al.table_name
    WHEN al.action = 'SOFT_DELETE' THEN 'Archived ' || al.table_name
    WHEN al.action = 'RESTORE' THEN 'Restored ' || al.table_name
  END as description
FROM audit_log al
ORDER BY al.created_at DESC;

-- Audit summary by user
CREATE OR REPLACE VIEW audit_summary_by_user AS
SELECT 
  user_email,
  COUNT(*) as total_actions,
  COUNT(*) FILTER (WHERE action = 'INSERT') as inserts,
  COUNT(*) FILTER (WHERE action = 'UPDATE') as updates,
  COUNT(*) FILTER (WHERE action IN ('DELETE', 'SOFT_DELETE')) as deletes,
  MAX(created_at) as last_action
FROM audit_log
WHERE user_email IS NOT NULL
GROUP BY user_email
ORDER BY total_actions DESC;

-- Audit summary by table
CREATE OR REPLACE VIEW audit_summary_by_table AS
SELECT 
  table_name,
  COUNT(*) as total_actions,
  COUNT(*) FILTER (WHERE action = 'INSERT') as inserts,
  COUNT(*) FILTER (WHERE action = 'UPDATE') as updates,
  COUNT(*) FILTER (WHERE action IN ('DELETE', 'SOFT_DELETE')) as deletes,
  MAX(created_at) as last_action
FROM audit_log
GROUP BY table_name
ORDER BY total_actions DESC;
```

### RLS Policies

```sql
-- SELECT: Admin and Supplier PM only
CREATE POLICY "Admin and Supplier PM can view audit logs" ON audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'supplier_pm')
    )
  );

-- INSERT: Append-only via triggers (system access)
CREATE POLICY "Audit logs are append only" ON audit_log
  FOR INSERT
  WITH CHECK (TRUE);
```

---

## Soft Delete Infrastructure

### Purpose
Enables recoverable deletion across all main entities, preventing accidental data loss.

### Implementation Pattern

#### 1. Standard Columns
All main tables include:

```sql
-- Soft delete columns (added to every main table)
is_deleted BOOLEAN DEFAULT FALSE,
deleted_at TIMESTAMPTZ,
deleted_by UUID REFERENCES auth.users(id)
```

#### 2. Tables with Soft Delete
- timesheets
- expenses
- resources
- partners
- milestones
- deliverables
- kpis
- quality_standards
- partner_invoices
- variations
- raid_items
- document_templates

#### 3. Helper Functions

```sql
-- Soft delete a record
CREATE OR REPLACE FUNCTION soft_delete(
  p_table_name TEXT,
  p_record_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
BEGIN
  EXECUTE format(
    'UPDATE %I SET is_deleted = TRUE, deleted_at = NOW(), deleted_by = $1 WHERE id = $2',
    p_table_name
  ) USING p_user_id, p_record_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Restore a soft-deleted record
CREATE OR REPLACE FUNCTION restore_deleted(
  p_table_name TEXT,
  p_record_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  EXECUTE format(
    'UPDATE %I SET is_deleted = FALSE, deleted_at = NULL, deleted_by = NULL WHERE id = $1',
    p_table_name
  ) USING p_record_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permanently delete old records
CREATE OR REPLACE FUNCTION purge_deleted_records(
  p_table_name TEXT,
  p_days_old INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  EXECUTE format(
    'DELETE FROM %I WHERE is_deleted = TRUE AND deleted_at < NOW() - INTERVAL ''%s days''',
    p_table_name,
    p_days_old
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 4. Partial Indexes
Optimized indexes for active and deleted records:

```sql
-- Example for timesheets
CREATE INDEX idx_timesheets_active 
  ON timesheets(project_id, date DESC) 
  WHERE is_deleted = FALSE OR is_deleted IS NULL;

CREATE INDEX idx_timesheets_deleted 
  ON timesheets(project_id, deleted_at DESC) 
  WHERE is_deleted = TRUE;
```

---

## Supporting Views

### Active Record Views
Convenience views that automatically filter out deleted records:

```sql
-- Active timesheets
CREATE OR REPLACE VIEW active_timesheets AS
SELECT * FROM timesheets WHERE is_deleted = FALSE OR is_deleted IS NULL;

-- Active expenses
CREATE OR REPLACE VIEW active_expenses AS
SELECT * FROM expenses WHERE is_deleted = FALSE OR is_deleted IS NULL;

-- Active resources
CREATE OR REPLACE VIEW active_resources AS
SELECT * FROM resources WHERE is_deleted = FALSE OR is_deleted IS NULL;

-- Active partners
CREATE OR REPLACE VIEW active_partners AS
SELECT * FROM partners WHERE is_deleted = FALSE OR is_deleted IS NULL;

-- Active milestones
CREATE OR REPLACE VIEW active_milestones AS
SELECT * FROM milestones WHERE is_deleted = FALSE OR is_deleted IS NULL;

-- Active deliverables
CREATE OR REPLACE VIEW active_deliverables AS
SELECT * FROM deliverables WHERE is_deleted = FALSE OR is_deleted IS NULL;

-- Active KPIs
CREATE OR REPLACE VIEW active_kpis AS
SELECT * FROM kpis WHERE is_deleted = FALSE OR is_deleted IS NULL;

-- Active quality standards
CREATE OR REPLACE VIEW active_quality_standards AS
SELECT * FROM quality_standards WHERE is_deleted = FALSE OR is_deleted IS NULL;

-- Active partner invoices
CREATE OR REPLACE VIEW active_partner_invoices AS
SELECT * FROM partner_invoices WHERE is_deleted = FALSE OR is_deleted IS NULL;

-- Active RAID items
CREATE OR REPLACE VIEW active_raid_items AS
SELECT 
  ri.*,
  r.name as owner_name,
  m.name as milestone_name,
  m.milestone_ref
FROM raid_items ri
LEFT JOIN resources r ON ri.owner_id = r.id
LEFT JOIN milestones m ON ri.milestone_id = m.id
WHERE ri.is_deleted = FALSE;
```

### Deleted Items Summary View

```sql
CREATE OR REPLACE VIEW deleted_items_summary AS
SELECT 
  'timesheets' as entity_type,
  id,
  deleted_at,
  deleted_by,
  (SELECT email FROM auth.users WHERE id = deleted_by) as deleted_by_email
FROM timesheets WHERE is_deleted = TRUE
UNION ALL
SELECT 'expenses', id, deleted_at, deleted_by,
  (SELECT email FROM auth.users WHERE id = deleted_by)
FROM expenses WHERE is_deleted = TRUE
UNION ALL
SELECT 'resources', id, deleted_at, deleted_by,
  (SELECT email FROM auth.users WHERE id = deleted_by)
FROM resources WHERE is_deleted = TRUE
UNION ALL
SELECT 'partners', id, deleted_at, deleted_by,
  (SELECT email FROM auth.users WHERE id = deleted_by)
FROM partners WHERE is_deleted = TRUE
UNION ALL
SELECT 'milestones', id, deleted_at, deleted_by,
  (SELECT email FROM auth.users WHERE id = deleted_by)
FROM milestones WHERE is_deleted = TRUE
UNION ALL
SELECT 'deliverables', id, deleted_at, deleted_by,
  (SELECT email FROM auth.users WHERE id = deleted_by)
FROM deliverables WHERE is_deleted = TRUE
ORDER BY deleted_at DESC;
```

---

## Relationships and Dependencies

### Table Relationship Diagram

```
┌─────────────────┐
│    projects     │
└────────┬────────┘
         │
         ├──────────────┬──────────────┬──────────────┬──────────────┐
         │              │              │              │              │
    ┌────▼────┐    ┌────▼────┐   ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
    │  kpis   │    │ quality_│   │  raid_  │   │variation│   │document_│
    │         │    │standards│   │  items  │   │   s     │   │templates│
    └─────────┘    └─────────┘   └────┬────┘   └────┬────┘   └─────────┘
                                       │             │
                                       │        ┌────▼─────────────┐
                                       │        │variation_        │
                                       │        │milestones        │
                                       │        └────┬─────────────┘
                                       │             │
                                       │        ┌────▼─────────────┐
                                       │        │variation_        │
                                       │        │deliverables      │
                                       │        └──────────────────┘
                                       │
                                       ▼
                              ┌────────────────┐
                              │  resources     │
                              └────────────────┘
                              ┌────────────────┐
                              │  milestones    │──┬──┐
                              └────────────────┘  │  │
                                                  │  │
                              ┌───────────────────▼──▼─┐
                              │milestone_baseline_     │
                              │versions                │
                              └────────────────────────┘
```

### Cross-Table Dependencies

#### KPIs Dependencies
- **project_id** → projects
- Assessed via deliverable_kpi_assessments
- Uses VALID_STATUSES for filtering

#### Quality Standards Dependencies
- **project_id** → projects
- Assessed via deliverable_qs_assessments
- Uses VALID_STATUSES for filtering

#### RAID Items Dependencies
- **project_id** → projects
- **owner_id** → resources
- **milestone_id** → milestones

#### Variations Dependencies
- **project_id** → projects
- **created_by**, **supplier_signed_by**, **customer_signed_by** → profiles
- Child tables: variation_milestones, variation_deliverables

#### Variation Milestones Dependencies
- **variation_id** → variations (CASCADE delete)
- **milestone_id** → milestones (SET NULL)
- Creates milestone_baseline_versions entries

#### Variation Deliverables Dependencies
- **variation_id** → variations (CASCADE delete)
- **variation_milestone_id** → variation_milestones (CASCADE delete)
- **deliverable_id** → deliverables (SET NULL)

#### Milestone Baseline Versions Dependencies
- **milestone_id** → milestones (CASCADE delete)
- **variation_id** → variations (SET NULL)
- **supplier_signed_by**, **customer_signed_by** → profiles

#### Document Templates Dependencies
- **project_id** → projects (CASCADE delete)
- **created_by**, **imported_by** → profiles
- **source_project_id** → projects (for imports)

#### Audit Log Dependencies
- **user_id** → auth.users
- **project_id** → projects (soft reference)
- **record_id** → various tables (soft reference)

---

## Benchmark Rates Table (Global)

> **Note:** Unlike other tables in this document, `benchmark_rates` is **global data** - not scoped to any project or organisation. It serves as a shared rate card for the SFIA 8 skills framework.

### Purpose

Stores UK market day rates for SFIA 8 skills across different supplier tiers. Used by:
- **Benchmarking tool** - Rate comparison and analysis
- **Estimator tool** - Cost estimation using current rates

### Table Structure

```sql
CREATE TABLE IF NOT EXISTS benchmark_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id VARCHAR(10) NOT NULL,
  skill_name VARCHAR(100) NOT NULL,
  skill_code VARCHAR(10) NOT NULL,
  subcategory_id VARCHAR(10) NOT NULL,
  category_id VARCHAR(10) NOT NULL,
  sfia_level INTEGER NOT NULL CHECK (sfia_level >= 1 AND sfia_level <= 7),
  tier_id VARCHAR(20) NOT NULL,
  tier_name VARCHAR(50) NOT NULL,
  day_rate DECIMAL(10,2) NOT NULL,
  source VARCHAR(200),
  effective_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT benchmark_rates_unique UNIQUE (skill_id, sfia_level, tier_id)
);
```

### Column Reference

| Column | Type | Description |
|--------|------|-------------|
| `skill_id` | VARCHAR(10) | SFIA skill identifier (e.g., 'PROG') |
| `skill_name` | VARCHAR(100) | Full skill name (e.g., 'Programming/Software Development') |
| `skill_code` | VARCHAR(10) | SFIA code |
| `subcategory_id` | VARCHAR(10) | SFIA subcategory |
| `category_id` | VARCHAR(10) | SFIA category (SA, CT, DI, DO, SQ, RE) |
| `sfia_level` | INTEGER | Responsibility level 1-7 |
| `tier_id` | VARCHAR(20) | Supplier tier (contractor, boutique, mid, big4) |
| `tier_name` | VARCHAR(50) | Tier display name |
| `day_rate` | DECIMAL(10,2) | Day rate in GBP |
| `source` | VARCHAR(200) | Rate source/origin |
| `effective_date` | DATE | When rate became effective |

### SFIA 8 Coverage

| Entity | Count |
|--------|-------|
| Categories | 6 |
| Subcategories | 19 |
| Skills | 97 |
| Levels | 7 |
| Tiers | 4 |
| **Potential Rate Combinations** | ~1,500+ |

### Tier Definitions

| Tier ID | Name | Typical Multiplier |
|---------|------|--------------------|
| `contractor` | Contractor/Freelance | 1.0x (base) |
| `boutique` | Boutique/SME | 1.3x |
| `mid` | Mid-tier Consultancy | 1.5x |
| `big4` | Big 4/Global SI | 1.9x |

### Indexes

```sql
CREATE INDEX idx_benchmark_rates_skill ON benchmark_rates(skill_id);
CREATE INDEX idx_benchmark_rates_category ON benchmark_rates(category_id);
CREATE INDEX idx_benchmark_rates_subcategory ON benchmark_rates(subcategory_id);
CREATE INDEX idx_benchmark_rates_level ON benchmark_rates(sfia_level);
CREATE INDEX idx_benchmark_rates_tier ON benchmark_rates(tier_id);
```

### Trigger

```sql
CREATE TRIGGER update_benchmark_rates_timestamp
  BEFORE UPDATE ON benchmark_rates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### RLS Policies

Unlike project-scoped tables, benchmark_rates uses simple public read / admin write:

```sql
-- Anyone can read rates
CREATE POLICY "Anyone can read benchmark rates" 
  ON benchmark_rates FOR SELECT TO authenticated 
  USING (true);

-- Only admins can modify rates
CREATE POLICY "Admins can modify benchmark rates" 
  ON benchmark_rates FOR ALL TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Related Service

See `benchmarkRates.service.js` in TECH-SPEC-08 for:
- `getAllRates(filters)` - Fetch with filters
- `getRate(skillId, sfiaLevel, tierId)` - Single rate lookup
- `buildRateLookup()` - Rate dictionary for Estimator
- `getRatesGroupedByCategory()` - Hierarchical grouping
- Rate statistics and comparisons

---

## Summary

The supporting tables provide critical infrastructure for:

1. **Performance Monitoring**: KPIs and quality standards with automated RAG status
2. **Risk Management**: RAID log with severity tracking
3. **Change Control**: Comprehensive variations system with version tracking
4. **Document Automation**: Template-driven document generation
5. **Compliance**: Automatic audit logging of all changes
6. **Data Safety**: Soft delete with recovery across all main entities

All tables follow consistent patterns:
- Multi-tenant via project_id
- Soft delete support (where applicable)
- Comprehensive audit trails
- Row-level security
- JSONB for flexible data structures
- Helper functions for common operations

---

**Document Status:** Complete ✅  
**Session 1.4 Checklist:**
- ✅ kpis table
- ✅ quality_standards table
- ✅ raid_items table
- ✅ variations table
- ✅ variation_milestones table
- ✅ variation_deliverables table (bonus)
- ✅ milestone_baseline_versions table (bonus)
- ✅ document_templates table
- ✅ audit_log table
- ✅ deleted_items infrastructure

**Next Session:** 1.5 - RLS Policies & Security

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|--------|
| 1.0 | 10 Dec 2025 | Claude AI | Initial creation |
| 1.1 | 23 Dec 2025 | Claude AI | Added organisation context note (Tier 3 entities), added Document History section |
| 1.2 | 28 Dec 2025 | Claude AI | Added benchmark_rates table (global SFIA 8 rate card) |
