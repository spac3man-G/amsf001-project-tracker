# AI Prompt: Multi-Tenancy Architecture & Feature Implementation

**Document:** `/docs/AI-PROMPT-Multi-Tenancy-Implementation.md`  
**Created:** 2025-12-15  
**Purpose:** Kick-off prompt for implementing supplier tenancy, cost estimation tool, and project wizard  
**Status:** Ready to initiate when required  

---

## Instructions for AI Assistant

You are continuing work on the AMSF001 Project Tracker application. This session involves implementing a major architectural enhancement to introduce **Supplier-level multi-tenancy**, along with two new features: a **Cost Estimation Tool** and a **Project Setup Wizard**.

### Before Starting, Read These Documents

Read these documents in order to understand the full context:

1. **Project Context** — `/docs/AI-PROMPT-Project-Context-v2.md`
   - Understand the existing application architecture, tech stack, and conventions

2. **Multi-Tenancy Roadmap** — `/docs/MULTI-TENANCY-ROADMAP.md`
   - Master implementation plan covering all three features
   - Supplier entity model and database schema changes
   - RLS policy overhaul strategy
   - Phased implementation roadmap
   - Impact on existing features

3. **Cost Estimation Tool Analysis** — `/docs/COST-ESTIMATION-TOOL-ANALYSIS.md`
   - Detailed requirements for the estimation tool
   - Rate card (supplier-scoped role catalog)
   - WBS editor, Gantt, resource allocation
   - Baseline management
   - Open questions requiring answers

4. **Project Wizard Analysis** — `/docs/PROJECT-WIZARD-VALIDATED.md`
   - Validated analysis of project configuration options
   - Feature toggles, billing models, workflow options
   - Integration with cost estimation (import from baseline)
   - What was verified vs what assumptions were corrected

---

## Context Summary

### Current State
- Application is project-centric with basic multi-tenancy (multiple projects, project-scoped roles)
- All projects work identically — no project-specific configuration
- Resources and Partners are project-scoped (duplicated across projects)
- No concept of "Supplier" as a top-level tenant

### Target State
- **Supplier** becomes the top-level tenant (e.g., JT Group, Vodafone)
- Each supplier has:
  - Their own projects
  - Shared resource pool (actual named people)
  - Shared partners (subcontractors like Progressive, 2D Cynics)
  - Rate card (standardized roles with rates for estimation)
  - Estimates (pre-project planning documents)
- **System Administrator** role operates above all suppliers
- Data isolation between suppliers
- Projects can be configured via wizard with feature toggles
- Estimates can be imported into projects

### Architecture Diagram
```
┌─────────────────────────────────────────────────────────────────────────┐
│                              PLATFORM                                    │
│                     System Administrator (super-admin)                   │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────┐    ┌─────────────────────────────┐    │
│  │     SUPPLIER: JT Group      │    │   SUPPLIER: Vodafone        │    │
│  │                             │    │                             │    │
│  │  Shared within supplier:    │    │  Shared within supplier:    │    │
│  │  • Rate Card                │    │  • Rate Card                │    │
│  │  • Resource Pool            │    │  • Resource Pool            │    │
│  │  • Partners                 │    │  • Partners                 │    │
│  │  • Estimates                │    │  • Estimates                │    │
│  │                             │    │                             │    │
│  │  Projects:                  │    │  Projects:                  │    │
│  │  • AMSF001, Future B        │    │  • Project X, Project Y     │    │
│  └─────────────────────────────┘    └─────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Open Questions — Must Be Answered Before Implementation

The user needs to provide answers to these questions. Ask for clarification on any that remain unanswered.

### Supplier Tenancy Questions (Critical for Phase 1)

| # | Question | Options | Default Recommendation |
|---|----------|---------|------------------------|
| **Q12** | Can a user belong to multiple suppliers? | A) No — one supplier per user<br>B) Yes — users can be in multiple suppliers | A) No — simplifies model significantly |
| **Q14** | Is there a "default" supplier for existing data migration? | A) Create "JT Group" as default<br>B) User specifies name | A) Create "JT Group" |
| **Q15** | Do customers (Customer PM, Customer Finance) belong to a supplier? | A) Yes — they're part of supplier org<br>B) No — they're external, project-scoped only | B) External — makes more sense semantically |
| **Q16** | Can system admin create users in any supplier? | A) Yes<br>B) No — only supplier admins create users | A) Yes |

### Cost Estimation Questions (Required for Phase 4)

| # | Question | Options | Default Recommendation |
|---|----------|---------|------------------------|
| **Q1** | Can Supplier PMs see each other's estimates within the same supplier? | A) Yes — all supplier PMs see all estimates<br>B) No — only creator sees their estimates<br>C) Configurable — creator can share | A) Yes — promotes collaboration |
| **Q2** | Can estimates be transferred between Supplier PMs? | A) Yes<br>B) No | A) Yes |
| **Q3** | Does creating a baseline require approval/sign-off? | A) No — PM creates freely<br>B) Yes — requires Supplier Admin approval | A) No — keep it simple |
| **Q4** | Can baselines be edited after creation? | A) No — immutable snapshots<br>B) Yes — can be updated | A) No — immutable |
| **Q5** | If rate card rates change, what happens to existing estimates? | A) Estimates update automatically<br>B) Estimates keep historical rates<br>C) User chooses | B) Keep historical |
| **Q6** | Can suppliers have multiple rate cards? | A) One rate card per supplier<br>B) Multiple (by client, contract type) | A) One — simplify MVP |
| **Q7** | Is GBP the only currency? | A) GBP only<br>B) Multi-currency | A) GBP only for MVP |
| **Q8** | Should there be pre-built estimate templates? | A) No templates<br>B) Supplier-defined templates | A) No — defer to Phase 2 |
| **Q9** | Can an estimate be cloned/duplicated? | A) Yes<br>B) No | A) Yes |
| **Q10** | Reuse existing Gantt component or build new? | A) Adapt existing<br>B) Build new | A) Adapt existing |
| **Q11** | Is offline support needed for estimates? | A) No — online only<br>B) Yes | A) No — significant complexity |
| **Q12** | PDF/Excel export of estimates required? | A) Not for MVP<br>B) Yes — PDF summary<br>C) Yes — Excel detail | A) Not for MVP |
| **Q13** | Integration with external systems? | A) Not for MVP<br>B) Yes — specify which | A) Not for MVP |

### Project Wizard Questions (Required for Phase 5)

| # | Question | Options | Default Recommendation |
|---|----------|---------|------------------------|
| **Q9** | Can project configuration be changed after creation? | A) Yes — via Settings<br>B) No — locked at creation | A) Yes |
| **Q10** | Should disabled features hide data or just UI? | A) Hide UI only (data preserved)<br>B) Hide data too | A) UI only |
| **Q11** | Template projects (pre-configured setups)? | A) Not for MVP<br>B) Yes | A) Not for MVP |

---

## Implementation Phases

Execute in this order:

### Phase 0: Planning & Design (1 week)
- [ ] Get answers to all open questions above
- [ ] Finalize entity relationships based on answers
- [ ] Design detailed RLS policy strategy
- [ ] Create migration plan for existing data
- [ ] UI/UX wireframes for new features

### Phase 1: Supplier Foundation (2-3 weeks)
**Database:**
- [ ] Create `suppliers` table
- [ ] Add `supplier_id` and `global_role` to `profiles`
- [ ] Add `supplier_id` to `projects`
- [ ] Create migration script for existing data
- [ ] Update all RLS policies

**Application:**
- [ ] Create `SupplierContext.jsx`
- [ ] Update `AuthContext.jsx` with supplier info
- [ ] Update `ProjectContext.jsx` to filter by supplier
- [ ] System admin supplier switching UI

### Phase 2: Resource & Partner Refactoring (1-2 weeks)
- [ ] Add `supplier_id` to `partners`, make `project_id` nullable
- [ ] Add `supplier_id` to `resources`, make `project_id` nullable
- [ ] Migrate existing data
- [ ] Update services and UI for pool model

### Phase 3: Rate Card (1-2 weeks)
- [ ] Create `rate_card_roles` table (supplier-scoped)
- [ ] Create `rateCard.service.js`
- [ ] Rate Card management UI (`/rate-card`)

### Phase 4: Cost Estimation Tool MVP (3-4 weeks)
- [ ] Create estimation tables (estimates, milestones, deliverables, allocations, baselines)
- [ ] Create estimation services
- [ ] Estimates list page (`/estimates`)
- [ ] Estimate editor with WBS, resource allocation, cost summary
- [ ] Baseline creation

### Phase 5: Project Wizard MVP (2-3 weeks)
- [ ] Create `ProjectConfigContext.jsx`
- [ ] Feature toggle infrastructure
- [ ] Navigation/dashboard filtering by config
- [ ] Project wizard UI
- [ ] Import from estimate baseline

### Phase 6: Integration & Polish (2 weeks)
- [ ] Estimate → Project import flow
- [ ] End-to-end testing
- [ ] Documentation updates

---

## Key Files to Reference

### Existing Files (Understand Before Modifying)
```
src/contexts/AuthContext.jsx      — User authentication, will need supplier_id
src/contexts/ProjectContext.jsx   — Project selection, will need supplier filtering
src/lib/navigation.js             — Navigation config, will need feature toggles
src/components/Layout.jsx         — Main layout, will need supplier context display
src/pages/Resources.jsx           — Will change to pool model
src/pages/Partners.jsx            — Will change to supplier-scoped
src/pages/Gantt.jsx               — May be adapted for estimates
```

### New Files to Create
```
src/contexts/SupplierContext.jsx       — Supplier state management
src/contexts/ProjectConfigContext.jsx  — Project feature configuration
src/services/rateCard.service.js       — Rate card CRUD
src/services/estimates.service.js      — Estimation CRUD
src/pages/RateCard.jsx                 — Rate card management
src/pages/Estimates.jsx                — Estimates list
src/pages/EstimateEditor.jsx           — Main estimation workspace
src/pages/ProjectWizard.jsx            — Project creation wizard
```

### Database Migrations Needed
```
supabase/migrations/
  YYYYMMDD_create_suppliers.sql
  YYYYMMDD_add_supplier_to_profiles.sql
  YYYYMMDD_add_supplier_to_projects.sql
  YYYYMMDD_refactor_partners_resources.sql
  YYYYMMDD_create_rate_card.sql
  YYYYMMDD_create_estimates.sql
  YYYYMMDD_add_project_config.sql
```

---

## Success Criteria

### Phase 1 Complete When:
- [ ] Multiple suppliers can exist in the system
- [ ] Users are assigned to suppliers
- [ ] Projects belong to suppliers
- [ ] Data is isolated between suppliers
- [ ] System admin can switch between suppliers
- [ ] All existing functionality works for default supplier

### Phase 4 Complete When:
- [ ] Rate card can be managed per supplier
- [ ] Estimates can be created with WBS
- [ ] Resources can be allocated from rate card
- [ ] Costs calculate correctly
- [ ] Baselines can be created and viewed

### Phase 5 Complete When:
- [ ] Projects can be created via wizard
- [ ] Features can be toggled per project
- [ ] Estimate baselines can be imported
- [ ] Navigation respects project config

---

## How to Start

1. **First**, ask the user to answer any remaining open questions from the tables above
2. **Second**, read the three analysis documents in full:
   - `/docs/MULTI-TENANCY-ROADMAP.md`
   - `/docs/COST-ESTIMATION-TOOL-ANALYSIS.md`
   - `/docs/PROJECT-WIZARD-VALIDATED.md`
3. **Third**, confirm the current phase to work on
4. **Fourth**, begin implementation following the phase checklist

---

## Notes for Future Sessions

- This work was analyzed on 2025-12-15
- The existing AMSF001 project has real data that must be migrated
- All new features must maintain backwards compatibility during transition
- Use feature flags where possible for gradual rollout
- The existing Gantt component in `src/pages/Gantt.jsx` can potentially be adapted for the estimation tool
- The existing `projects.settings` JSONB column can store project configuration (no new table needed for that)

---

*This prompt provides complete context to resume this work at any time. Point the AI assistant to this document to initiate implementation.*
