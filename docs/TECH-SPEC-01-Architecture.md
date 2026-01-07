# AMSF001 Technical Specification: Architecture & Infrastructure

**Document:** TECH-SPEC-01-Architecture.md  
**Version:** 2.3  
**Created:** 10 December 2025  
**Updated:** 7 January 2026  
**Session:** Documentation Review Phase 4  

> **Version 2.3 Updates (7 January 2026):**
> - Added EvaluationContext, ReportBuilderContext to contexts listing
> - Added 19 Evaluator services in evaluator/ subfolder
> - Added 13 missing services to root services listing
> - Added Evaluator pages (14 pages in evaluator/ subfolder)
> - Added Planning, Admin, Onboarding page folders
> - Added Hub.jsx to pages listing
> - Added 8 Evaluator API endpoints in evaluator/ subfolder
> - Added missing API endpoints (planning-ai, report-ai, manage-project-users, etc.)

> **Version 2.2 Updates (7 January 2026):**
> - Updated database table count from 28 to 60+ (reflects Evaluator module addition)
> - See TECH-SPEC-11-Evaluator.md for Evaluator module documentation
> - See TECH-SPEC-02 for detailed core table schemas

> **Version 2.1 Updates (6 January 2026):**
> - Added Claude Opus 4 to AI Integration table (Planning AI document analysis)
> - Added useResizableColumns.js and usePlanningIntegration.js to hooks listing

> **Version 2.0 Updates (23 December 2025):**
> - Updated to three-tier multi-tenancy model (Organisation → Project → Entity)
> - Added OrganisationContext, OrganisationSwitcher to project structure
> - Added organisation.service.js to services listing
> - Updated Multi-Tenancy Architecture section (Section 7)
> - Added Document History section

---

## 1. Executive Summary

The AMSF001 Project Tracker is a multi-tenant SaaS application designed to manage complex project portfolios for enterprise clients. Built with a modern React frontend and Supabase backend, it provides comprehensive project management capabilities including milestone tracking, deliverable management, time and expense tracking, variation control, and partner invoicing.

The architecture follows a serverless approach, leveraging Vercel for hosting and edge functions, with Supabase providing the PostgreSQL database, authentication, and Row Level Security (RLS) for multi-tenant data isolation.

**Multi-Tenancy Model (Updated December 2025):** The application implements a three-tier multi-tenancy model:
- **Organisations**: Top-level tenants (e.g., companies)
- **Projects**: Belong to organisations, contain project data
- **Entities**: Project-scoped data (milestones, deliverables, timesheets, etc.)

Users can belong to multiple organisations with different roles (org_owner, org_admin, org_member), and within each organisation, can be assigned to multiple projects with project-specific roles.

---

## 2. Technology Stack

### 2.1 Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI framework with functional components and hooks |
| React Router DOM | 6.20.0 | Client-side routing and navigation |
| Vite | 5.4.21 | Build tool and development server |
| Recharts | 2.10.0 | Dashboard charts and data visualisation |
| Lucide React | 0.294.0 | Icon library |
| React Grid Layout | 1.5.2 | Drag-and-drop dashboard customisation |
| date-fns | 3.0.0 | Date manipulation and formatting |

### 2.2 Backend Stack

| Technology | Purpose |
|------------|---------|
| Supabase | Backend-as-a-Service platform |
| PostgreSQL | Primary database (via Supabase) |
| Row Level Security | Multi-tenant data isolation |
| Supabase Auth | User authentication and session management |

### 2.3 Deployment & Hosting

| Technology | Purpose |
|------------|---------|
| Vercel | Frontend hosting and serverless functions |
| Vercel Analytics | Performance and usage analytics |
| Vercel Speed Insights | Core Web Vitals monitoring |

### 2.4 AI Integration

| Technology | Purpose |
|------------|---------|
| Anthropic Claude | AI-powered chat assistant and receipt scanning |
| Claude Haiku | Fast responses for chat and context building |
| Claude Sonnet 4.5 | Complex queries and document analysis |
| Claude Opus 4 | Planning AI document analysis (WBS generation) |

---

## 3. Project Structure

```
amsf001-project-tracker/
├── api/                          # Vercel Serverless Functions
│   ├── chat.js                   # AI chat endpoint (streaming)
│   ├── chat-stream.js            # Alternative streaming implementation
│   ├── chat-context.js           # Context retrieval for AI
│   ├── create-user.js            # Admin user creation endpoint
│   ├── create-organisation.js    # Organisation creation (NEW)
│   ├── create-project.js         # Project creation (NEW)
│   ├── manage-project-users.js   # User-project management (NEW)
│   ├── planning-ai.js            # Planning AI document analysis (NEW)
│   ├── report-ai.js              # Report AI generation (NEW)
│   ├── scan-receipt.js           # Receipt OCR with Claude Vision
│   └── evaluator/                # Evaluator module APIs (NEW)
│       ├── ai-document-parse.js  # Document parsing
│       ├── ai-gap-analysis.js    # Gap analysis AI
│       ├── ai-market-research.js # Market research AI
│       ├── ai-requirement-suggest.js # Requirement suggestions
│       ├── client-portal-auth.js # Client portal authentication
│       ├── create-evaluation.js  # Create evaluation project
│       ├── generate-report.js    # Report generation
│       └── vendor-portal-auth.js # Vendor portal authentication
│
├── src/                          # Frontend Source Code
│   ├── App.jsx                   # Root application component
│   ├── main.jsx                  # Application entry point
│   ├── index.css                 # Global styles
│   ├── design-system.css         # Design system tokens
│   │
│   ├── components/               # Reusable UI Components
│   │   ├── Layout.jsx            # Main layout with navigation
│   │   ├── ProjectSwitcher.jsx   # Multi-tenant project selection
│   │   ├── OrganisationSwitcher.jsx # Organisation selection (NEW)
│   │   ├── ViewAsBar.jsx         # Role impersonation UI
│   │   ├── NotificationBell.jsx  # Notification system
│   │   ├── chat/                 # AI Chat components
│   │   ├── common/               # Shared components
│   │   ├── dashboard/            # Dashboard widgets
│   │   ├── deliverables/         # Deliverable components
│   │   ├── expenses/             # Expense management
│   │   ├── milestones/           # Milestone components
│   │   ├── partners/             # Partner management
│   │   ├── raid/                 # RAID log components
│   │   ├── resources/            # Resource management
│   │   ├── timesheets/           # Timesheet components
│   │   └── variations/           # Change control components
│   │
│   ├── contexts/                 # React Context Providers
│   │   ├── AuthContext.jsx       # Authentication state
│   │   ├── OrganisationContext.jsx # Current organisation (NEW)
│   │   ├── ProjectContext.jsx    # Current project (depends on org)
│   │   ├── ViewAsContext.jsx     # Role impersonation
│   │   ├── ChatContext.jsx       # AI chat state
│   │   ├── EvaluationContext.jsx # Evaluator module state (NEW)
│   │   ├── ReportBuilderContext.jsx # Report builder state (NEW)
│   │   ├── MetricsContext.jsx    # Dashboard metrics cache
│   │   ├── ToastContext.jsx      # Notification toasts
│   │   ├── NotificationContext.jsx # System notifications
│   │   ├── HelpContext.jsx       # Contextual help system
│   │   └── TestUserContext.jsx   # Test user management
│   │
│   ├── hooks/                    # Custom React Hooks
│   │   ├── usePermissions.js     # Role-based access control
│   │   ├── useMetrics.js         # Dashboard metrics
│   │   ├── useDashboardLayout.js # Widget layout persistence
│   │   ├── useForm.js            # Form state management
│   │   ├── useFormValidation.js  # Form validation
│   │   ├── useReadOnly.js        # Read-only mode detection
│   │   ├── useDocumentTemplates.js # Template management
│   │   ├── useResizableColumns.js # Table column resize with persistence (NEW)
│   │   ├── usePlanningIntegration.js # Planner-Tracker integration
│   │   ├── useMilestonePermissions.js
│   │   ├── useDeliverablePermissions.js
│   │   ├── useTimesheetPermissions.js
│   │   └── useResourcePermissions.js
│   │
│   ├── services/                 # Data Services Layer
│   │   ├── base.service.js       # Base service with common methods
│   │   ├── organisation.service.js # Organisation management (NEW)
│   │   ├── milestones.service.js # Milestone CRUD operations
│   │   ├── deliverables.service.js
│   │   ├── resources.service.js
│   │   ├── timesheets.service.js
│   │   ├── expenses.service.js
│   │   ├── partners.service.js
│   │   ├── invoicing.service.js
│   │   ├── variations.service.js
│   │   ├── kpis.service.js
│   │   ├── raid.service.js
│   │   ├── qualityStandards.service.js
│   │   ├── dashboard.service.js
│   │   ├── calendar.service.js
│   │   ├── metrics.service.js
│   │   ├── documentTemplates.service.js
│   │   ├── documentRenderer.service.js
│   │   ├── receiptScanner.service.js
│   │   ├── standards.service.js
│   │   ├── invitation.service.js     # Org invitations (NEW)
│   │   ├── subscription.service.js   # Subscription management (NEW)
│   │   ├── planItemsService.js       # Planning tool (NEW)
│   │   ├── planCommitService.js      # Planner-Tracker sync (NEW)
│   │   ├── syncService.js            # Generic sync utilities (NEW)
│   │   ├── benchmarkRates.service.js # SFIA 8 rates (NEW)
│   │   ├── estimates.service.js      # Cost estimator (NEW)
│   │   ├── reportTemplates.service.js # Report templates (NEW)
│   │   ├── reportDataFetcher.service.js # Report data (NEW)
│   │   ├── reportRenderer.service.js # Report rendering (NEW)
│   │   ├── workflow.service.js       # Workflow engine (NEW)
│   │   ├── email.service.js          # Email notifications (NEW)
│   │   └── evaluator/                # Evaluator module services (NEW)
│   │       ├── ai.service.js
│   │       ├── approvals.service.js
│   │       ├── base.evaluator.service.js
│   │       ├── clientPortal.service.js
│   │       ├── comments.service.js
│   │       ├── emailNotifications.service.js
│   │       ├── evaluationCategories.service.js
│   │       ├── evaluationDocuments.service.js
│   │       ├── evaluationProjects.service.js
│   │       ├── evidence.service.js
│   │       ├── requirements.service.js
│   │       ├── scores.service.js
│   │       ├── stakeholderAreas.service.js
│   │       ├── surveys.service.js
│   │       ├── traceability.service.js
│   │       ├── vendorQuestions.service.js
│   │       ├── vendors.service.js
│   │       └── workshops.service.js
│   │
│   ├── pages/                    # Page Components (Routes)
│   │   ├── Login.jsx             # Authentication page
│   │   ├── Dashboard.jsx         # Main dashboard
│   │   ├── Milestones.jsx        # Milestone list
│   │   ├── MilestoneDetail.jsx   # Milestone detail view
│   │   ├── Deliverables.jsx      # Deliverable management
│   │   ├── Timesheets.jsx        # Timesheet entry
│   │   ├── Expenses.jsx          # Expense management
│   │   ├── Partners.jsx          # Partner list
│   │   ├── PartnerDetail.jsx     # Partner invoicing
│   │   ├── Variations.jsx        # Change control list
│   │   ├── VariationDetail.jsx   # Variation view
│   │   ├── VariationForm.jsx     # Variation wizard
│   │   ├── Resources.jsx         # Resource list
│   │   ├── ResourceDetail.jsx    # Resource availability
│   │   ├── RaidLog.jsx           # RAID management
│   │   ├── KPIs.jsx              # KPI tracking
│   │   ├── QualityStandards.jsx  # Quality management
│   │   ├── Calendar.jsx          # Project calendar
│   │   ├── Reports.jsx           # Reporting module
│   │   ├── AuditLog.jsx          # Audit trail viewer
│   │   ├── DeletedItems.jsx      # Soft delete recovery
│   │   ├── Users.jsx             # User management
│   │   ├── Settings.jsx          # Project settings
│   │   ├── AccountSettings.jsx   # User preferences
│   │   ├── Hub.jsx               # Organisation hub (NEW)
│   │   ├── planning/             # Planning Tool pages (NEW)
│   │   │   ├── Planning.jsx      # WBS planning
│   │   │   ├── Estimator.jsx     # Cost estimator
│   │   │   ├── Benchmarking.jsx  # SFIA 8 rates
│   │   │   └── ...
│   │   ├── admin/                # Admin pages (NEW)
│   │   │   ├── AdminHome.jsx     # Admin dashboard
│   │   │   ├── UsersManagement.jsx
│   │   │   └── ...
│   │   ├── onboarding/           # Onboarding pages (NEW)
│   │   │   ├── OnboardingWizard.jsx
│   │   │   ├── LandingPage.jsx
│   │   │   └── ...
│   │   └── evaluator/            # Evaluator module pages (NEW)
│   │       ├── EvaluatorDashboard.jsx
│   │       ├── Requirements.jsx
│   │       ├── Vendors.jsx
│   │       ├── VendorDetail.jsx
│   │       ├── Workshops.jsx
│   │       ├── Surveys.jsx
│   │       ├── Scoring.jsx
│   │       ├── ConsensusScoring.jsx
│   │       ├── Evidence.jsx
│   │       ├── Reports.jsx
│   │       ├── Traceability.jsx
│   │       ├── Settings.jsx
│   │       ├── ClientPortal.jsx
│   │       └── VendorPortal.jsx
│   │
│   ├── lib/                      # Utility Libraries
│   │   ├── supabase.js           # Supabase client initialisation
│   │   ├── permissions.js        # Permission checking utilities
│   │   ├── permissionMatrix.js   # Role-permission definitions
│   │   ├── formatters.js         # Data formatting utilities
│   │   ├── constants.js          # Application constants
│   │   ├── cache.js              # Client-side caching
│   │   ├── errorHandler.js       # Centralised error handling
│   │   ├── sanitize.js           # Input sanitisation
│   │   ├── navigation.js         # Navigation utilities
│   │   ├── utils.js              # General utilities
│   │   ├── naturalDateParser.js  # Natural language date parsing
│   │   ├── milestoneCalculations.js
│   │   ├── deliverableCalculations.js
│   │   ├── resourceCalculations.js
│   │   └── timesheetCalculations.js
│   │
│   ├── config/                   # Configuration Files
│   │   ├── dashboardPresets.js   # Dashboard layout presets
│   │   └── metricsConfig.js      # Metrics definitions
│   │
│   └── help/                     # Contextual Help Content
│
├── sql/                          # Database Migrations
│   ├── rls-migration/            # RLS policy migrations
│   ├── variations-tables.sql     # Variations schema
│   ├── audit-triggers.sql        # Audit logging triggers
│   ├── soft-delete-implementation.sql
│   └── [additional migrations]
│
├── docs/                         # Documentation
│   └── [documentation files]
│
├── package.json                  # NPM dependencies
├── vite.config.js                # Vite build configuration
├── vercel.json                   # Vercel deployment config
├── index.html                    # HTML entry point
└── .env.example                  # Environment template
```

---

## 4. Build and Deployment Process

### 4.1 Development Workflow

```bash
# Install dependencies
npm install

# Start development server (port 5173)
npm run dev

# Preview production build locally (port 4173)
npm run preview
```

### 4.2 Build Configuration (vite.config.js)

The Vite configuration implements several optimisations:

**Chunk Splitting Strategy:**
| Chunk | Contents | Rationale |
|-------|----------|-----------|
| vendor-react | react, react-dom, react-router-dom | Core framework, rarely changes |
| vendor-supabase | @supabase/supabase-js | Database client, rarely changes |
| vendor-charts | recharts | Charts library, lazy-loaded |
| vendor-icons | lucide-react | Icon library, tree-shaken |

**Build Settings:**
- Target: ES2020 (modern browsers)
- Minification: esbuild (fast, built-in)
- Console/debugger removal in production
- Consistent chunk naming for caching

### 4.3 Vercel Deployment

**Routing Configuration (vercel.json):**
```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- API routes (`/api/*`) are handled by serverless functions
- All other routes serve the SPA (client-side routing)

**Deployment Process:**
1. Push to main branch triggers Vercel build
2. Vite builds production bundle
3. Serverless functions deployed to `/api`
4. Static assets served via Vercel Edge Network
5. Environment variables injected at build time

### 4.4 Build Output

Production build creates:
```
dist/
├── index.html
└── assets/
    ├── vendor-react-[hash].js     # ~140KB gzipped
    ├── vendor-supabase-[hash].js  # ~45KB gzipped
    ├── vendor-charts-[hash].js    # ~80KB gzipped
    ├── vendor-icons-[hash].js     # Tree-shaken icons
    ├── index-[hash].js            # Application code
    └── [name]-[hash].css          # Styles
```

---

## 5. Environment Variables

### 5.1 Required Variables

| Variable | Side | Purpose |
|----------|------|---------|
| `VITE_SUPABASE_URL` | Client | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Client | Supabase anonymous API key |
| `ANTHROPIC_API_KEY` | Server | Claude AI API authentication |

### 5.2 Optional Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_PROJECT_REF` | AMSF001 | Default project reference |
| `VITE_DEBUG` | false | Enable debug logging |

### 5.3 Variable Naming Convention

- `VITE_` prefix: Exposed to client-side code
- No prefix: Server-side only (API routes)

**Security Note:** The Supabase anon key is safe for client-side exposure because Row Level Security (RLS) policies protect data at the database level.

---

## 6. External Service Dependencies

### 6.1 Supabase (Required)

| Service | Usage |
|---------|-------|
| PostgreSQL Database | Primary data storage |
| Authentication | User login, sessions, password management |
| Row Level Security | Multi-tenant data isolation |
| Real-time | Not currently used (future consideration) |
| Storage | Used for expense_files (receipts) and evaluation_documents (Evaluator module) |

**Connection:** Via `@supabase/supabase-js` client library

### 6.2 Vercel (Required)

| Service | Usage |
|---------|-------|
| Static Hosting | SPA hosting via Edge Network |
| Serverless Functions | API endpoints for AI integration |
| Analytics | Page views and user metrics |
| Speed Insights | Core Web Vitals monitoring |

### 6.3 Anthropic Claude (Required for AI Features)

| Model | Usage |
|-------|-------|
| Claude Haiku | Fast responses for chat context building |
| Claude Sonnet | Complex queries, analysis, receipt scanning |

**Integration Points:**
- `/api/chat.js` - Main AI chat with tool use
- `/api/chat-context.js` - Project context retrieval
- `/api/scan-receipt.js` - Receipt OCR with Claude Vision

### 6.4 Service Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         BROWSER                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    React SPA                             │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │    │
│  │  │ Contexts │ │  Hooks   │ │ Services │ │   Pages  │   │    │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘   │    │
│  │       └────────────┴────────────┴────────────┘          │    │
│  └───────────────────────────┬─────────────────────────────┘    │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                      VERCEL EDGE NETWORK                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Serverless Functions                     │   │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────────────┐   │   │
│  │  │  /api/chat │ │/api/create │ │/api/scan-receipt   │   │   │
│  │  │            │ │   -user    │ │                    │   │   │
│  │  └─────┬──────┘ └─────┬──────┘ └─────────┬──────────┘   │   │
│  │        │              │                   │              │   │
│  └────────┼──────────────┼───────────────────┼──────────────┘   │
└───────────┼──────────────┼───────────────────┼──────────────────┘
            │              │                   │
            ▼              │                   ▼
┌────────────────────┐     │     ┌────────────────────────────────┐
│   ANTHROPIC API    │     │     │           SUPABASE             │
│  ┌──────────────┐  │     │     │  ┌──────────────────────────┐  │
│  │ Claude Haiku │  │     │     │  │      PostgreSQL          │  │
│  │ Claude Sonnet│  │     │     │  │  ┌──────────────────┐   │  │
│  └──────────────┘  │     │     │  │  │    60+ Tables    │   │  │
│                    │     │     │  │  │   + RLS Policies │   │  │
└────────────────────┘     │     │  │  └──────────────────┘   │  │
                           │     │  │                          │  │
                           └─────┼──│  ┌──────────────────┐   │  │
                                 │  │  │  Authentication   │   │  │
                                 └──│  └──────────────────┘   │  │
                                    └──────────────────────────┘  │
                                    └────────────────────────────┘
```

---

## 7. Multi-Tenancy Architecture

### 7.1 Overview (Updated December 2025)

The application implements a **three-tier multi-tenancy model**:

```
┌─────────────────────────────────────────────────────┐
│              ORGANISATION (Tier 1)                │
│         Top-level tenant (e.g., company)          │
│    Roles: org_owner, org_admin, org_member        │
├─────────────────────────┬───────────────────────────┤
│       PROJECT A (Tier 2)    │       PROJECT B (Tier 2)    │
│   Roles: admin, supplier_pm,│   Roles: admin, supplier_pm,│
│   customer_pm, contributor  │   customer_pm, contributor  │
├─────────────┬─────────────┼─────────────┬─────────────┤
│ Milestones  │ Resources   │ Milestones  │ Resources   │
│ Deliverables│ Timesheets  │ Deliverables│ Timesheets  │
│ (Tier 3)    │ (Tier 3)    │ (Tier 3)    │ (Tier 3)    │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

### 7.2 Key Tables

**Organisation Level:**
- **organisations**: Top-level tenant definitions (name, slug, settings)
- **user_organisations**: Junction table for org membership and roles

**Project Level:**
- **projects**: Project definitions with `organisation_id` foreign key
- **user_projects**: Junction table for project membership and roles
- **profiles**: User accounts (linked to Supabase Auth)

### 7.3 Data Isolation

RLS policies enforce a hierarchical access model using SECURITY DEFINER helper functions:

```sql
-- Helper function to check project access (org-aware)
CREATE FUNCTION can_access_project(p_project_id uuid) 
RETURNS boolean AS $
  SELECT 
    is_system_admin()  -- System admins access all
    OR EXISTS (  -- Org admins access all org projects
      SELECT 1 FROM projects p
      JOIN user_organisations uo ON uo.organisation_id = p.organisation_id
      WHERE p.id = p_project_id
      AND uo.user_id = auth.uid()
      AND uo.org_role IN ('org_owner', 'org_admin')
    )
    OR EXISTS (  -- Regular users need explicit project membership
      SELECT 1 FROM user_projects up
      WHERE up.project_id = p_project_id
      AND up.user_id = auth.uid()
    )
$ LANGUAGE sql SECURITY DEFINER;

-- Example RLS policy using helper
CREATE POLICY "Users can view project data"
ON milestones FOR SELECT
USING (can_access_project(project_id));
```

### 7.4 Context Hierarchy

React contexts are nested in dependency order:

```jsx
<AuthProvider>              {/* User authentication */}
  <OrganisationProvider>    {/* Current organisation (NEW) */}
    <ProjectProvider>       {/* Current project (filtered by org) */}
      <ViewAsProvider>      {/* Role impersonation */}
        {/* ... other providers ... */}
      </ViewAsProvider>
    </ProjectProvider>
  </OrganisationProvider>
</AuthProvider>
```

The `OrganisationContext` manages the current organisation selection, and `ProjectContext` filters available projects by the current organisation.

---

## 8. Security Architecture

### 8.1 Authentication Flow

1. User submits credentials via Login page
2. Supabase Auth validates and returns session token
3. Token stored in browser localStorage
4. All subsequent API calls include auth token
5. RLS policies validate user access to data

### 8.2 Authorisation Layers

| Layer | Mechanism |
|-------|-----------|
| UI | Role-based menu and action visibility |
| Hooks | Permission checking before operations |
| Services | Project-scoped queries |
| Database | RLS policies enforce access at SQL level |

### 8.3 Role Hierarchy

```
Admin → Full access to all features
Project Manager → Project management, approvals
Contributor → Data entry, limited views
Viewer → Read-only access
```

---

## 9. Performance Considerations

### 9.1 Client-Side Caching

- `MetricsContext` caches dashboard metrics
- `cache.js` provides general-purpose caching
- React Query patterns in services for data staleness

### 9.2 Bundle Optimisation

- Vendor chunking for better caching
- Tree-shaking for unused code elimination
- Dynamic imports for route-based code splitting

### 9.3 Database Performance

- Indexed columns on frequently queried fields
- RLS policies optimised for join performance
- Soft delete pattern preserves referential integrity

---

## 10. Session Completion

### 10.1 Checklist Status

- [x] Tech stack overview (React, Supabase, Vercel, Claude)
- [x] Project structure diagram
- [x] Build and deployment process
- [x] Environment variables reference
- [x] External service dependencies

### 10.2 Next Session Preview

**Session 1.2: Database Schema - Core Tables** will document:
- projects table
- profiles table
- user_projects table (multi-tenancy)
- milestones table
- deliverables table
- resources table
- resource_availability table
- Entity relationships diagram

---

*Document generated as part of AMSF001 Documentation Project*

---

## 11. Document History

| Version | Date | Author | Changes |
|---------|------|--------|--------|
| 1.0 | 10 Dec 2025 | Claude AI | Initial creation |
| 2.0 | 23 Dec 2025 | Claude AI | **Organisation Multi-Tenancy**: Updated to three-tier model, added OrganisationContext/OrganisationSwitcher, updated Multi-Tenancy Architecture section |
| 2.1 | 6 Jan 2026 | Claude AI | Added Claude Opus 4, useResizableColumns, usePlanningIntegration |
| 2.2 | 7 Jan 2026 | Claude AI | **Table count update**: 28 → 60+ tables (Evaluator module, Planning enhancements) |
