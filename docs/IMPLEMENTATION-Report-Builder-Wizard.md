# Report Builder Wizard - Implementation Plan

**Document Version:** 1.1  
**Created:** 11 December 2025  
**Status:** Implementation Ready  
**Estimated Segments:** 13 (including documentation)  
**Estimated Total Effort:** 7-9 AI chat sessions  

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture Summary](#2-architecture-summary)
3. [Prerequisites Checklist](#3-prerequisites-checklist)
4. [Implementation Segments](#4-implementation-segments)
   - [Segment 1: Database Schema & Service Foundation](#segment-1-database-schema--service-foundation)
   - [Segment 2: Report Section Type Definitions](#segment-2-report-section-type-definitions)
   - [Segment 3: Data Fetcher Service](#segment-3-data-fetcher-service)
   - [Segment 4: Report Renderer Service](#segment-4-report-renderer-service)
   - [Segment 5: Report Builder Context](#segment-5-report-builder-context)
   - [Segment 6: Wizard UI - Step 1 Template Selection](#segment-6-wizard-ui---step-1-template-selection)
   - [Segment 7: Wizard UI - Step 2 Parameters](#segment-7-wizard-ui---step-2-parameters)
   - [Segment 8: Wizard UI - Step 3 Section Builder](#segment-8-wizard-ui---step-3-section-builder)
   - [Segment 9: Section Configuration Modals](#segment-9-section-configuration-modals)
   - [Segment 10: AI Assistant Integration](#segment-10-ai-assistant-integration)
   - [Segment 11: Preview & Generation](#segment-11-preview--generation)
   - [Segment 12: Pre-built Templates & Polish](#segment-12-pre-built-templates--polish)
   - [Segment 13: Documentation Updates](#segment-13-documentation-updates)
5. [Testing Checklist](#5-testing-checklist)
6. [Documentation Updates Required](#6-documentation-updates-required)
7. [End of Session Protocol](#7-end-of-session-protocol)

---

## 1. Overview

### 1.1 Purpose

Create a Report Builder Wizard that enables users to generate customizable project reports through:
- **Pre-built templates** for common reports (e.g., Monthly Retrospective)
- **Section library** for building custom reports
- **AI assistant** for natural language configuration and content generation
- **HTML output** with browser print-to-PDF capability

### 1.2 Primary Use Case

Support the **Monthly Programme Retrospective** meeting with a report containing:
- Backward-looking: Milestones achieved, KPI performance, budget analysis, RAID items, lessons learned
- Forward-looking: Upcoming milestones, dependencies, resource requirements

### 1.3 Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Reusable** | Not hard-coded to one project or report type |
| **Template-driven** | Report definitions stored as JSONB in database |
| **AI-enhanced** | Optional AI assistance at every step |
| **Progressive disclosure** | Simple path for common needs, power for advanced users |
| **Existing patterns** | Follow established service/context/component architecture |

---

## 2. Architecture Summary

### 2.1 Component Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Reports Page (Reports.jsx)                       │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    ReportBuilderWizard.jsx                       │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │ Step 1: TemplateSelector │ Step 2: ParameterConfig │      │  │   │
│  │  │ Step 3: SectionBuilder   │ Step 4: PreviewGenerate │      │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  │                              │                                   │   │
│  │  ┌───────────────────────────┴───────────────────────────────┐  │   │
│  │  │              ReportAIAssistant.jsx (sidebar)              │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │      ReportBuilderContext     │
                    │   (wizard state management)   │
                    └───────────────┬───────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ ReportTemplates │     │ ReportDataFetcher│     │ ReportRenderer  │
│    Service      │     │    Service       │     │    Service      │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │              ┌────────┴────────┐              │
         │              │  MetricsService │              │
         │              │  RaidService    │              │
         │              │  (existing)     │              │
         │              └─────────────────┘              │
         │                                               │
         ▼                                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase (report_templates table)             │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 File Structure (New Files)

```
src/
├── components/
│   └── reports/                          # NEW DIRECTORY
│       ├── ReportBuilderWizard.jsx       # Main wizard container
│       ├── ReportBuilderWizard.css       # Wizard styles
│       ├── TemplateSelector.jsx          # Step 1
│       ├── ParameterConfig.jsx           # Step 2
│       ├── SectionBuilder.jsx            # Step 3
│       ├── SectionConfigModal.jsx        # Section configuration
│       ├── PreviewGenerate.jsx           # Step 4
│       ├── ReportAIAssistant.jsx         # AI sidebar
│       ├── ReportPreview.jsx             # Live preview component
│       └── index.js                      # Barrel exports
│
├── contexts/
│   └── ReportBuilderContext.jsx          # NEW FILE
│
├── services/
│   ├── reportTemplates.service.js        # NEW FILE
│   ├── reportDataFetcher.service.js      # NEW FILE
│   └── reportRenderer.service.js         # NEW FILE
│
├── lib/
│   ├── reportSectionTypes.js             # NEW FILE - Section type definitions
│   └── defaultReportTemplates.js         # NEW FILE - Pre-built templates
│
├── pages/
│   └── Reports.jsx                       # MODIFY - integrate wizard
│
└── api/
    └── report-ai.js                      # NEW FILE - AI endpoint for reports

sql/
└── P17-report-templates.sql              # NEW FILE - Schema extension
```

---

## 3. Prerequisites Checklist

Before starting implementation, verify:

- [x] Access to project repository at `/Users/glennnickols/Projects/amsf001-project-tracker`
- [x] Read `AMSF001-Technical-Specification.md` for architecture context
- [x] Read `TECH-SPEC-08-Services.md` for service patterns
- [x] Read `TECH-SPEC-07-Frontend-State.md` for context patterns
- [x] Understand existing `documentTemplates.service.js` and `documentRenderer.service.js`
- [ ] Understand `metricsService` data structures

---

## 4. Implementation Segments

Each segment is designed to be completed in a single AI chat session (approximately 30-60 minutes). Segments can be done sequentially or some in parallel where noted.

**IMPORTANT:** Each segment includes verification steps and a session end checklist. Documentation notes should be captured during each segment for use in Segment 13.

---

### Segment 1: Database Schema & Service Foundation

**Objective:** Create database schema and base service for report templates

**Estimated Time:** 30-45 minutes

**Dependencies:** None (starting point)

#### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `sql/P17-report-templates.sql` | CREATE | Database schema |
| `src/services/reportTemplates.service.js` | CREATE | Template CRUD service |
| `src/services/index.js` | MODIFY | Export new service |

#### Database Schema

```sql
-- sql/P17-report-templates.sql

-- Report Templates Table
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Identity
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Classification
  report_type VARCHAR(50) NOT NULL DEFAULT 'custom',
  
  -- Template Definition (JSONB)
  template_definition JSONB NOT NULL DEFAULT '{}',
  
  -- Defaults
  default_parameters JSONB DEFAULT '{}',
  
  -- Status
  is_system BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Soft delete
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES profiles(id),
  version INTEGER DEFAULT 1,
  
  CONSTRAINT unique_report_template_code UNIQUE (project_id, code)
);

-- Generated Reports Log
CREATE TABLE IF NOT EXISTS report_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  template_id UUID REFERENCES report_templates(id),
  report_name VARCHAR(255) NOT NULL,
  parameters_used JSONB,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID REFERENCES profiles(id),
  output_html TEXT,
  generation_time_ms INTEGER,
  sections_count INTEGER,
  ai_assisted BOOLEAN DEFAULT false
);

-- RLS Policies
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_generations ENABLE ROW LEVEL SECURITY;
```

#### Verification Steps

1. [ ] SQL file executes without errors in Supabase
2. [ ] Tables `report_templates` and `report_generations` created
3. [ ] RLS policies active and tested
4. [ ] Service exports correctly from `src/services/index.js`
5. [ ] Basic CRUD operations work

#### Documentation Notes to Capture

- [ ] Note table structure for TECH-SPEC-02 or TECH-SPEC-09
- [ ] Note RLS policy patterns for TECH-SPEC-05
- [ ] Note any deviations from plan

#### Session End Checklist

- [ ] Commit SQL file
- [ ] Commit service file
- [ ] Update services index.js
- [ ] Record documentation notes

---

### Segment 2: Report Section Type Definitions

**Objective:** Define all available report section types with their configurations

**Estimated Time:** 30-40 minutes

**Dependencies:** None (can be done in parallel with Segment 1)

#### Files to Create

| File | Action | Description |
|------|--------|-------------|
| `src/lib/reportSectionTypes.js` | CREATE | Section type definitions |

#### Key Section Types

| Section Type | Category | Data Source |
|--------------|----------|-------------|
| `milestone_summary` | backward | metricsService.getMilestoneMetrics |
| `deliverable_summary` | backward | metricsService.getDeliverableMetrics |
| `kpi_performance` | backward | metricsService.getKPIMetrics |
| `quality_standards` | backward | metricsService.getQualityStandardMetrics |
| `budget_analysis` | backward | metricsService.getAllDashboardMetrics |
| `raid_summary` | backward | raidService.getAllWithRelations |
| `timesheet_summary` | backward | metricsService.getTimesheetMetrics |
| `expense_summary` | backward | metricsService.getExpenseMetrics |
| `forward_look` | forward | custom query |
| `lessons_learned` | content | user input |
| `executive_summary` | content | AI generated |
| `custom_text` | content | user input |

#### Verification Steps

1. [ ] File exports all section types
2. [ ] Each section type has valid icon import
3. [ ] All config schemas are complete
4. [ ] Helper functions return correct data

#### Documentation Notes to Capture

- [ ] Document section types for TECH-SPEC-08 (services)
- [ ] Note config schema patterns

---

### Segment 3: Data Fetcher Service

**Objective:** Create service that fetches data for report sections

**Estimated Time:** 45-60 minutes

**Dependencies:** Segment 2 (section type definitions)

#### Files to Create

| File | Action | Description |
|------|--------|-------------|
| `src/services/reportDataFetcher.service.js` | CREATE | Data fetching logic |

#### Key Methods

- `fetchSectionData(sectionType, config, context)` - Main entry point
- `getDateRange(periodFilter)` - Date range calculation
- `fetchMilestoneSummary(projectId, config)` - Milestone data
- `fetchDeliverableSummary(projectId, config)` - Deliverable data
- `fetchKPIPerformance(projectId, config)` - KPI data
- `fetchRAIDSummary(projectId, config)` - RAID data
- `fetchForwardLook(projectId, config)` - Forward looking data

#### Verification Steps

1. [ ] Service can fetch data for each section type
2. [ ] Date range filtering works correctly
3. [ ] Status filtering works correctly
4. [ ] Role-based restrictions applied where needed

#### Documentation Notes to Capture

- [ ] Document service methods for TECH-SPEC-08
- [ ] Note data transformation patterns

---

### Segment 4: Report Renderer Service

**Objective:** Create service that renders report sections to HTML

**Estimated Time:** 45-60 minutes

**Dependencies:** Segment 2 (section types), Segment 3 (data fetcher)

#### Files to Create

| File | Action | Description |
|------|--------|-------------|
| `src/services/reportRenderer.service.js` | CREATE | HTML rendering logic |

#### Key Methods

- `renderReport(template, sectionData, context)` - Main entry point
- `renderSection(section, data, context)` - Single section render
- `renderMilestoneSummary(section, data, context)` - Milestone HTML
- `renderKPIPerformance(section, data, context)` - KPI HTML
- `wrapDocument(sectionsHtml, template, context)` - Full HTML document
- `getReportStyles()` - CSS styles including print styles

#### Verification Steps

1. [ ] Can render each section type to HTML
2. [ ] Styles render correctly in browser
3. [ ] Print preview shows page breaks correctly
4. [ ] Empty data handled gracefully

#### Documentation Notes to Capture

- [ ] Document rendering patterns for TECH-SPEC-08
- [ ] Note CSS/styling approach

---

### Segment 5: Report Builder Context

**Objective:** Create React context for wizard state management

**Estimated Time:** 30-45 minutes

**Dependencies:** Segments 1-4

#### Files to Create

| File | Action | Description |
|------|--------|-------------|
| `src/contexts/ReportBuilderContext.jsx` | CREATE | Wizard state management |

#### State Structure

```javascript
{
  currentStep: 1,
  selectedTemplate: null,
  isCustom: false,
  reportName: '',
  parameters: { reportingPeriod: 'lastMonth' },
  sections: [],
  previewHtml: null,
  isGenerating: false,
  aiPanelOpen: false,
  aiMessages: [],
  isDirty: false
}
```

#### Key Actions

- `setStep`, `nextStep`, `prevStep` - Navigation
- `selectTemplate` - Template selection
- `addSection`, `updateSection`, `removeSection`, `reorderSections` - Section management
- `setPreview`, `setGenerating` - Preview state
- `toggleAIPanel`, `addAIMessage` - AI assistant
- `canProceed` - Validation helper

#### Verification Steps

1. [ ] Context provides all needed state
2. [ ] Actions update state correctly
3. [ ] Navigation helpers work properly
4. [ ] canProceed validation works

#### Documentation Notes to Capture

- [ ] Document context state shape for TECH-SPEC-07
- [ ] Document actions and hooks for TECH-SPEC-07

---

### Segment 6: Wizard UI - Step 1 Template Selection

**Objective:** Build the first wizard step for template selection

**Estimated Time:** 45-60 minutes

**Dependencies:** Segment 5 (context)

#### Files to Create

| File | Action | Description |
|------|--------|-------------|
| `src/components/reports/index.js` | CREATE | Barrel exports |
| `src/components/reports/ReportBuilderWizard.jsx` | CREATE | Main wizard container |
| `src/components/reports/ReportBuilderWizard.css` | CREATE | Wizard styles |
| `src/components/reports/TemplateSelector.jsx` | CREATE | Step 1 component |

#### Key UI Elements

- Step progress indicator (1-2-3-4)
- Template cards showing: name, description, section count, icon
- "Start from Scratch" option
- "Describe what you need" AI option
- Next/Cancel buttons

#### Verification Steps

1. [ ] Wizard container renders with step indicator
2. [ ] Template cards display correctly
3. [ ] "Start from Scratch" option works
4. [ ] Navigation to Step 2 works

---

### Segment 7: Wizard UI - Step 2 Parameters

**Objective:** Build parameter configuration step

**Estimated Time:** 30-45 minutes

**Dependencies:** Segment 6

#### Files to Create

| File | Action | Description |
|------|--------|-------------|
| `src/components/reports/ParameterConfig.jsx` | CREATE | Step 2 component |

#### Key Features

- Report name input
- Reporting period selector (Last Month, Last Quarter, Custom)
- Custom date range picker (if selected)
- Template-specific parameters

#### Verification Steps

1. [ ] Report name input works with validation
2. [ ] Period selector updates context
3. [ ] Custom date range appears when needed
4. [ ] Navigation to Step 3 works

---

### Segment 8: Wizard UI - Step 3 Section Builder

**Objective:** Build the section management interface

**Estimated Time:** 60-75 minutes

**Dependencies:** Segments 6, 7

#### Files to Create

| File | Action | Description |
|------|--------|-------------|
| `src/components/reports/SectionBuilder.jsx` | CREATE | Step 3 component |
| `src/components/reports/SectionLibrary.jsx` | CREATE | Available sections panel |
| `src/components/reports/SectionList.jsx` | CREATE | Current sections list |

#### Key Features

- Two-column layout: Section Library | Current Sections
- Section library grouped by category
- Drag-and-drop reordering
- Click section to configure
- Remove section button
- AI assistant input at bottom

#### Verification Steps

1. [ ] Section library displays all section types
2. [ ] Can add sections to report
3. [ ] Can reorder sections via drag-and-drop
4. [ ] Can remove sections
5. [ ] Can click to open configuration

---

### Segment 9: Section Configuration Modals

**Objective:** Build configuration modals for each section type

**Estimated Time:** 45-60 minutes

**Dependencies:** Segment 8

#### Files to Create

| File | Action | Description |
|------|--------|-------------|
| `src/components/reports/SectionConfigModal.jsx` | CREATE | Generic config modal |
| `src/components/reports/configFields/index.js` | CREATE | Config field components |
| `src/components/reports/configFields/SelectField.jsx` | CREATE | Select input |
| `src/components/reports/configFields/MultiSelectField.jsx` | CREATE | Multi-select input |
| `src/components/reports/configFields/BooleanField.jsx` | CREATE | Toggle/checkbox |
| `src/components/reports/configFields/NumberField.jsx` | CREATE | Number input |
| `src/components/reports/configFields/TextareaField.jsx` | CREATE | Text area |

#### Key Features

- Dynamic form generation from configSchema
- Validation based on field types
- AI assist button for content fields

#### Verification Steps

1. [ ] Modal opens with correct fields for section type
2. [ ] Each field type renders correctly
3. [ ] Changes save to section config
4. [ ] Modal closes properly

---

### Segment 10: AI Assistant Integration

**Objective:** Build the AI assistant sidebar and API endpoint

**Estimated Time:** 60-90 minutes

**Dependencies:** Segments 6-9

#### Files to Create

| File | Action | Description |
|------|--------|-------------|
| `src/components/reports/ReportAIAssistant.jsx` | CREATE | AI sidebar component |
| `api/report-ai.js` | CREATE | AI endpoint |

#### AI Capabilities

1. **Section Discovery**: Natural language → section suggestion
2. **Filter Configuration**: Natural language → config update
3. **Content Generation**: Generate text for content sections
4. **Explanation**: Explain what sections show

#### Verification Steps

1. [ ] AI panel opens/closes correctly
2. [ ] Can send messages to AI
3. [ ] AI can suggest sections
4. [ ] AI can generate content
5. [ ] Actions from AI update wizard state

#### Documentation Notes to Capture

- [ ] Document /api/report-ai endpoint for TECH-SPEC-06
- [ ] Note AI system prompt and tools

---

### Segment 11: Preview & Generation

**Objective:** Build preview and report generation

**Estimated Time:** 45-60 minutes

**Dependencies:** Segments 3-10

#### Files to Create

| File | Action | Description |
|------|--------|-------------|
| `src/components/reports/PreviewGenerate.jsx` | CREATE | Step 4 component |
| `src/components/reports/ReportPreview.jsx` | CREATE | Preview iframe/panel |

#### Key Features

- Live preview panel (iframe with rendered HTML)
- Refresh preview button
- Print button (opens browser print dialog)
- Save as Template button
- Generation progress indicator

#### Verification Steps

1. [ ] Preview renders current report configuration
2. [ ] Print button works
3. [ ] Save as Template works
4. [ ] Error states display correctly

---

### Segment 12: Pre-built Templates & Polish

**Objective:** Create default templates and polish the experience

**Estimated Time:** 45-60 minutes

**Dependencies:** All previous segments

#### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/lib/defaultReportTemplates.js` | CREATE | Pre-built templates |
| `src/pages/Reports.jsx` | MODIFY | Integrate wizard |
| Various | MODIFY | Bug fixes and polish |

#### Pre-built Templates

1. **Monthly Retrospective** - Full backward/forward look
2. **Project Status Summary** - Quick overview
3. **Budget Variance Report** - Financial focus

#### Verification Steps

1. [ ] All three templates load correctly
2. [ ] Reports page shows wizard
3. [ ] Navigation menu item works
4. [ ] All features work end-to-end

---

### Segment 13: Documentation Updates

**Objective:** Update all technical documentation to reflect Report Builder implementation

**Estimated Time:** 60-90 minutes

**Dependencies:** All previous segments completed and verified

**CRITICAL:** This segment ensures documentation consistency with the existing TECH-SPEC documentation set.

#### Files to Update

| Document | Sections to Update |
|----------|-------------------|
| `AMSF001-Technical-Specification.md` | Master reference - add Report Builder to feature list, architecture, services |
| `TECH-SPEC-02-Database-Core.md` OR create `TECH-SPEC-09-Database-Reports.md` | Document report_templates and report_generations tables |
| `TECH-SPEC-05-RLS-Security.md` | Add RLS policies for report tables |
| `TECH-SPEC-06-API-AI.md` | Document /api/report-ai endpoint |
| `TECH-SPEC-07-Frontend-State.md` | Document ReportBuilderContext |
| `TECH-SPEC-08-Services.md` | Document all three report services |

---

## 5. Testing Checklist

### Functional Testing

- [ ] Can select pre-built template
- [ ] Can build custom report from scratch
- [ ] Can add/remove/reorder sections
- [ ] Can configure each section type
- [ ] AI assistant responds helpfully
- [ ] AI can add sections via natural language
- [ ] AI can generate content (lessons learned, summary)
- [ ] Preview renders correctly
- [ ] Print produces clean output
- [ ] Can save custom template
- [ ] Can load saved template

### Role-Based Testing

- [ ] Admin can access all features
- [ ] Supplier PM can access all features
- [ ] Customer PM can generate reports
- [ ] Cost data hidden from Customer PM where appropriate

### Edge Cases

- [ ] Empty project (no data) handled gracefully
- [ ] Very large dataset renders without timeout
- [ ] Browser back button doesn't lose work
- [ ] Session timeout doesn't lose unsaved work

---

## 6. Documentation Updates Required

This section provides a consolidated view of all documentation that must be updated. **Segment 13** provides the detailed implementation guide for these updates.

### Summary Table

| Document | Type | Update Required |
|----------|------|-----------------|
| `AMSF001-Technical-Specification.md` | Master Spec | Add Report Builder to features, architecture, services lists |
| `TECH-SPEC-02-Database-Core.md` | Database | Add report_templates and report_generations tables |
| `TECH-SPEC-05-RLS-Security.md` | Security | Add RLS policies for report tables |
| `TECH-SPEC-06-API-AI.md` | API | Document /api/report-ai endpoint |
| `TECH-SPEC-07-Frontend-State.md` | Frontend | Document ReportBuilderContext |
| `TECH-SPEC-08-Services.md` | Services | Document ReportTemplatesService, ReportDataFetcherService, ReportRendererService |

### Alternative: Create New Documents

If existing documents become too long, create:
- `TECH-SPEC-09-Database-Reports.md` - Dedicated report schema documentation
- `TECH-SPEC-10-Report-Builder.md` - Comprehensive Report Builder documentation

### Documentation Quality Checklist

Before marking documentation complete:

- [ ] All new tables documented with column descriptions
- [ ] All new services documented with method signatures
- [ ] All new contexts documented with state shape and actions
- [ ] All new API endpoints documented with request/response examples
- [ ] All RLS policies documented with SQL examples
- [ ] Cross-references between documents are accurate
- [ ] Consistent formatting with existing documentation
- [ ] Version numbers updated where applicable

---

## 7. End of Session Protocol

**Follow this protocol at the end of EVERY implementation segment.**

### 7.1 Code Completion Checklist

Before ending any segment session:

- [ ] All files listed in segment are created/modified
- [ ] All verification steps pass
- [ ] No console errors in browser
- [ ] Changes tested manually
- [ ] Code follows existing patterns

### 7.2 Documentation Notes

During each segment, capture notes for Segment 13:

```markdown
## Segment [N] Documentation Notes

### New Files Created
- path/to/file.js - brief description

### Database Changes
- table_name - changes made

### New Methods/Functions
- serviceName.methodName() - brief description

### Deviations from Plan
- What was different and why

### Issues Encountered
- Issue and resolution
```

### 7.3 Commit Protocol

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "Report Builder: Segment N - [Description]

- Created [files]
- Implemented [features]
- [Any notes]"

# Push to remote
git push origin main
```

### 7.4 Session Handoff Notes

At the end of each session, note:

1. **Completed:** What was finished
2. **Pending:** What remains in this segment (if any)
3. **Issues:** Any blockers or concerns
4. **Next:** What the next session should start with

---

## Appendix A: Session Start Prompt

Use this prompt when starting each implementation segment:

```
I'm continuing work on the AMSF001 Project Tracker Report Builder Wizard.

Project Location: /Users/glennnickols/Projects/amsf001-project-tracker

Please read:
1. /docs/IMPLEMENTATION-Report-Builder-Wizard.md (this plan)
2. /docs/AMSF001-Technical-Specification.md (for context)

I'm working on Segment [N]: [Segment Name]

The previous segments completed are: [list completed segments]

Let's implement this segment following the plan.
```

---

## Appendix B: Quick Reference

### Key Patterns to Follow

**Services:** Singleton pattern extending BaseService (see `documentTemplates.service.js`)

**Contexts:** useReducer pattern with action creators (see `ChatContext.jsx`)

**Components:** Functional components with hooks (see `components/chat/`)

**Modals:** Use ConfirmDialog pattern from `components/common/`

### Import Paths

```javascript
// Services
import { reportTemplatesService } from '../services/reportTemplates.service';
import { metricsService } from '../services/metrics.service';

// Context
import { useReportBuilder } from '../contexts/ReportBuilderContext';

// Section types
import { SECTION_TYPE, SECTION_TYPE_CONFIG } from '../lib/reportSectionTypes';

// Common components
import { Card, LoadingSpinner, StatusBadge } from '../components/common';
```

### Existing Documentation Reference

| Document | Key Content | When to Reference |
|----------|-------------|-------------------|
| `AMSF001-Technical-Specification.md` | Master architecture | Always |
| `TECH-SPEC-02-Database-Core.md` | Table patterns | Segment 1 |
| `TECH-SPEC-05-RLS-Security.md` | RLS patterns | Segment 1 |
| `TECH-SPEC-06-API-AI.md` | AI endpoint patterns | Segment 10 |
| `TECH-SPEC-07-Frontend-State.md` | Context patterns | Segment 5 |
| `TECH-SPEC-08-Services.md` | Service patterns | Segments 1, 3, 4 |

---

## Appendix C: Segment Progress Tracker

Use this tracker to monitor implementation progress:

| Segment | Description | Status | Date | Notes |
|---------|-------------|--------|------|-------|
| 1 | Database Schema & Service Foundation | 🟡 In Progress | 11 Dec 2025 | Current |
| 2 | Report Section Type Definitions | ⬜ Not Started | | |
| 3 | Data Fetcher Service | ⬜ Not Started | | |
| 4 | Report Renderer Service | ⬜ Not Started | | |
| 5 | Report Builder Context | ⬜ Not Started | | |
| 6 | Wizard UI - Step 1 Template Selection | ⬜ Not Started | | |
| 7 | Wizard UI - Step 2 Parameters | ⬜ Not Started | | |
| 8 | Wizard UI - Step 3 Section Builder | ⬜ Not Started | | |
| 9 | Section Configuration Modals | ⬜ Not Started | | |
| 10 | AI Assistant Integration | ⬜ Not Started | | |
| 11 | Preview & Generation | ⬜ Not Started | | |
| 12 | Pre-built Templates & Polish | ⬜ Not Started | | |
| 13 | Documentation Updates | ⬜ Not Started | | |

**Status Legend:**
- ⬜ Not Started
- 🟡 In Progress
- ✅ Complete
- ❌ Blocked

---

*Document Version: 1.1*  
*Created: 11 December 2025*  
*Last Updated: 11 December 2025*  
*For use with AMSF001 Project Tracker*
