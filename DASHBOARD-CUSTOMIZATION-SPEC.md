# AMSF001 Project Tracker
# Dashboard Customization - Technical Specification

**Version:** 1.0  
**Created:** 1 December 2025  
**Priority:** Phase 5 - Enhanced UX  
**Estimated Effort:** 12-16 hours (Full) | 6-8 hours (Simple)  
**Status:** Ready for Implementation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [User Stories](#2-user-stories)
3. [Current Dashboard Analysis](#3-current-dashboard-analysis)
4. [Feature Requirements](#4-feature-requirements)
5. [Technical Architecture](#5-technical-architecture)
6. [Implementation Plan](#6-implementation-plan)
7. [Alternative Approach](#7-alternative-approach-simple)
8. [Testing Strategy](#8-testing-strategy)
9. [Deployment Checklist](#9-deployment-checklist)

---

## 1. Executive Summary

### Problem Statement
The current dashboard displays the same fixed layout to all users regardless of their role or preferences. Users cannot prioritize the information most relevant to their work, leading to information overload and reduced efficiency.

### Proposed Solution
Implement a customizable dashboard that allows users to:
- Rearrange widgets via drag-and-drop
- Resize widgets to preferred dimensions
- Show/hide widgets based on relevance
- Save layouts per user per project
- Reset to role-based defaults

### Business Value
- **Improved Efficiency:** Users see most relevant data first
- **Role Optimization:** Different roles need different views
- **User Satisfaction:** Personalized experience increases engagement
- **Flexibility:** Adapts to changing project needs

### Success Metrics
- 70%+ users customize their dashboard within first week
- 50% reduction in time to find key information
- 4.5+ user satisfaction rating (out of 5)
- Zero regressions in dashboard performance

---

## 2. User Stories

### Primary User Story
**As a user,** I want to customize my dashboard layout  
**So that** I can see the information most relevant to my role and preferences  
**Acceptance Criteria:**
- I can drag widgets to reorder them
- I can resize widgets to different sizes
- I can hide widgets I don't use
- My preferences persist across sessions
- I can reset to default at any time

### Role-Specific Stories

#### Supplier PM
**As a Supplier PM,** I want to see budget tracking and milestone progress prominently  
**So that** I can manage project costs and delivery effectively  
**Priority:** Budget widgets, Milestone status, Resource utilization

#### Customer PM
**As a Customer PM,** I want to see KPIs and quality standards first  
**So that** I can verify deliverables meet requirements  
**Priority:** KPI achievements, QS compliance, Deliverable status

#### Contributor
**As a Contributor,** I want to see my assigned tasks and recent timesheets  
**So that** I can focus on my work without distraction  
**Priority:** My deliverables, My timesheets, Upcoming deadlines

#### Admin
**As an Admin,** I want to see system health and user activity  
**So that** I can monitor project operations  
**Priority:** All widgets, System stats, Audit activity

#### Viewer
**As a Viewer,** I want a simplified read-only view  
**So that** I can understand project status without clutter  
**Priority:** Progress hero, Key metrics, Milestone status

---

## 3. Current Dashboard Analysis

### Existing Widgets (Dashboard.jsx)

| Widget ID | Name | Description | Lines | Default Size |
|-----------|------|-------------|-------|--------------|
| `progress-hero` | Project Progress | Overall % complete with circular chart | 10 | 2x1 (full-width) |
| `budget-summary` | Budget Overview | Total budget + spend to date | 15 | 1x1 |
| `pmo-tracking` | PMO Cost Tracking | PMO vs Non-PMO budget breakdown | 30 | 2x1 (full-width) |
| `stats-grid` | Key Statistics | Milestones, Deliverables, Resources, KPIs, QS | 40 | 2x2 |
| `certificates` | Milestone Certificates | Signed, pending, awaiting generation | 15 | 1x1 |
| `milestones-list` | Milestones | Status, progress, spend by milestone | 50 | 2x2 |
| `kpis-category` | KPIs by Category | Grouped KPI performance | 35 | 1x2 |
| `quality-standards` | Quality Standards | QS achievement summary | 30 | 1x2 |

**Total:** 8 widgets, ~225 lines of rendering logic

### Current Layout Structure
```
[Full Width: Progress Hero]
[50%: Budget]  [50%: Budget Details]
[Full Width: PMO Tracking]
[Full Width: Stats Grid - 5 cards]
[50%: Certificates] [50%: Future]
[Full Width: Milestones List]
[50%: KPIs]  [50%: Quality Standards]
```

### Dependencies
- Services: `milestonesService`, `deliverablesService`, `kpisService`, `qualityStandardsService`, `timesheetsService`
- Contexts: `TestUserContext`, `ProjectContext`
- Components: `LoadingSpinner`, `PageHeader`, `StatCard`, `StatusBadge`

---

## 4. Feature Requirements

### 4.1 Core Features (MVP)

#### Drag-and-Drop Repositioning
- **Description:** Users can click and drag widgets to new positions
- **Behavior:** 
  - Grid-based positioning (12 columns)
  - Snap-to-grid behavior
  - Visual feedback during drag (opacity, placeholder)
  - Collision detection and auto-layout
- **Library:** `react-grid-layout` v1.3.4
- **Bundle Impact:** ~200KB

#### Widget Resizing
- **Description:** Users can resize widgets to preferred dimensions
- **Sizes Supported:**
  - Small: 1x1 (single column, 1 row)
  - Medium: 2x1 (half-width, 1 row)
  - Large: 2x2 (half-width, 2 rows)
  - Full: 4x1 (full-width, 1 row)
- **Behavior:**
  - Drag from corner/edge to resize
  - Minimum size constraints per widget
  - Responsive breakpoints

#### Show/Hide Widgets
- **Description:** Users can toggle widget visibility
- **UI:**
  - "Customize" button in header
  - Checklist of available widgets
  - Toggle switches for each
- **Storage:** Include in layout config

#### Save/Load Preferences
- **Description:** Preferences persist across sessions
- **Storage:** PostgreSQL `dashboard_layouts` table
- **Format:** JSONB column with layout config
- **Scope:** Per user, per project
- **Auto-save:** On layout change (debounced 2 seconds)

#### Reset to Default
- **Description:** Users can restore role-based default layout
- **UI:** "Reset to Default" button in customize mode
- **Confirmation:** "Are you sure?" dialog
- **Behavior:** Load preset for current user role

#### Edit Mode Toggle
- **Description:** Clear separation between view and edit modes
- **States:**
  - **View Mode:** Normal dashboard (default)
  - **Edit Mode:** Show resize handles, drag cursor, customize panel
- **Toggle:** Button in PageHeader
- **Keyboard:** Escape key exits edit mode

---

## 5. Technical Architecture

### 5.1 Database Schema

#### New Table: `dashboard_layouts`

```sql
CREATE TABLE dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  layout_config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, project_id)
);

-- Index for faster lookups
CREATE INDEX idx_dashboard_layouts_user_project 
ON dashboard_layouts(user_id, project_id);

-- RLS Policies
ALTER TABLE dashboard_layouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own layouts"
ON dashboard_layouts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own layouts"
ON dashboard_layouts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own layouts"
ON dashboard_layouts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own layouts"
ON dashboard_layouts FOR DELETE
USING (auth.uid() = user_id);
```

#### Layout Config JSONB Structure

```json
{
  "version": "1.0",
  "widgets": {
    "progress-hero": {
      "visible": true,
      "position": { "x": 0, "y": 0, "w": 12, "h": 1 }
    },
    "budget-summary": {
      "visible": true,
      "position": { "x": 0, "y": 1, "w": 6, "h": 1 }
    }
  }
}
```

### 5.2 Role-Based Default Presets

See specification document for complete preset configurations for:
- Admin (all widgets visible)
- Supplier PM (budget/milestones focus)
- Customer PM (KPIs/quality focus)
- Contributor (simplified view)
- Viewer (read-only essentials)

---

## 6. Implementation Plan

### Phase 1: Foundation (4-5 hours)
- Install react-grid-layout
- Create database schema
- Extract widgets into components
- Implement basic drag-and-drop

### Phase 2: Persistence (3-4 hours)
- Create dashboard service
- Build useDashboardLayout hook
- Implement auto-save
- Apply role-based defaults

### Phase 3: Polish (3-4 hours)
- Add edit mode toggle
- Build customize panel
- Widget improvements
- Loading/error states

### Phase 4: Mobile (2-3 hours)
- Define breakpoints
- Mobile fallback
- Tablet optimization

**Total: 12-16 hours**

---

## 7. Alternative Approach (Simple)

### Widget Visibility Only (6-8 hours)

**Features:**
- Show/hide widgets only
- No drag-and-drop
- No resizing
- Fixed positions
- 60% of value, 50% less time

**Recommendation:** Start simple, upgrade if needed

---

## 8. Testing Strategy

- Unit tests for widget registry, layouts, presets
- Integration tests for database operations
- E2E tests for user workflows
- Performance tests (<2s load, 60fps drag)

---

## 9. Deployment Checklist

- [ ] Database migration
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Code review completed
- [ ] Documentation updated
- [ ] User acceptance testing
- [ ] Monitor metrics

---

## Appendix: Technical Details

### Dependencies
```json
{
  "dependencies": {
    "react-grid-layout": "^1.3.4"
  }
}
```

### Browser Support
- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Timeline Estimate
- Full Version: 12-16 hours
- Simple Version: 6-8 hours

---

**Document Status:** ✅ Ready for Implementation  
**Next Steps:** Review with team, choose full vs simple approach  
**Created:** 1 December 2025
