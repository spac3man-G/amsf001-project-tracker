# AI Session Prompt: Evaluator Manual Testing Documentation

## Your Mission

Create comprehensive documentation and manual user test scripts for the Evaluator tool. This includes:

1. **User Guide Documentation** - How the application works from a user's perspective
2. **Manual Test Scripts** - Step-by-step test cases covering the entire vendor evaluation workflow from project setup to vendor selection

## Project Context

You are working on the **Evaluator** tool within the AMSF001 Project Tracker application. Evaluator is a multi-tenant vendor evaluation platform designed for consultancy use.

**Location:** `~/Projects/amsf001-project-tracker/`

**Key Documentation to Read First:**
- `docs/EVALUATOR-IMPLEMENTATION-PLAN.md` - Master implementation guide with phase details
- `docs/EVALUATOR-TECHNICAL-ARCHITECTURE.md` - Technical design and data model
- `docs/APPLICATION-CONTEXT.md` - Full application architecture

## Technology Stack

- **Frontend:** React 18 + Vite
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Hosting:** Vercel
- **AI:** Claude API for gap analysis, market research, document parsing

## User Roles to Document

| Role | Description |
|------|-------------|
| **Consultant Admin** | Full access - configure projects, manage users, all features |
| **Consultant Evaluator** | Capture requirements, score vendors, collect evidence |
| **Client Stakeholder** | View progress, approve requirements, participate in workshops |
| **Vendor** | Respond to questions via portal, upload materials |

## The Complete Vendor Evaluation Workflow

Document and create test scripts for this end-to-end workflow:

### Phase 1: Project Setup
1. Create a new Evaluation Project
2. Configure basic project details (name, client, dates)
3. Set up Stakeholder Areas (e.g., Operations, IT, Finance, Compliance)
4. Define Evaluation Categories with weights (must total 100%)
5. Configure the scoring scale (typically 1-5)
6. Invite team members and assign roles

### Phase 2: Requirements Gathering
1. Schedule workshops with attendees
2. Conduct workshop and capture requirements live
3. Import requirements from documents (AI parsing)
4. Manually add additional requirements
5. Assign categories and stakeholder areas to requirements
6. Set priority (MoSCoW: Must Have, Should Have, Could Have, Won't Have)
7. Submit requirements for review/approval
8. Client stakeholders approve or request changes

### Phase 3: Evaluation Criteria Setup
1. Create evaluation criteria linked to categories
2. Assign weights to criteria within each category
3. Link requirements to relevant criteria
4. Run AI Gap Analysis to identify missing coverage
5. Finalize criteria framework

### Phase 4: Vendor Management
1. Add vendors to the long list
2. Research vendors (AI market research feature)
3. Move vendors through pipeline stages (Long List → Short List → RFP Issued)
4. Create vendor portal access codes
5. Set up vendor questions (RFP questions)
6. Enable vendor portal for selected vendors

### Phase 5: Vendor Portal (Vendor Perspective)
1. Vendor accesses portal with access code
2. Views questions organized by section
3. Submits responses (text, yes/no, multiple choice)
4. Uploads supporting documents
5. Tracks completion progress
6. Receives confirmation of submission

### Phase 6: Evidence Collection
1. Collect evidence from demos, references, documents
2. Link evidence to specific requirements/criteria
3. Tag evidence by type (Demo, Reference, Documentation, Response)
4. Add sentiment indicators (Positive, Neutral, Negative)

### Phase 7: Scoring & Evaluation
1. Individual evaluators score each vendor against criteria
2. Add rationale for each score
3. Link evidence to support scores
4. View scoring variance between evaluators
5. Conduct reconciliation session
6. Establish consensus scores
7. Mark evaluation complete for each vendor

### Phase 8: Analysis & Reporting
1. View Traceability Matrix (Requirements × Vendors)
2. Drill down into score details
3. Generate Executive Summary report
4. Generate Detailed Evaluation report
5. Generate Traceability report
6. Export to PDF/Excel

### Phase 9: Client Portal (Client Perspective)
1. Client accesses branded portal with access code
2. Views project dashboard with progress
3. Reviews requirements and provides approvals
4. Views shortlisted vendors and scores
5. Accesses generated reports
6. Adds comments/feedback

### Phase 10: Vendor Selection
1. Review final scores and rankings
2. Compare vendors side-by-side
3. Document selection rationale
4. Update vendor status to "Selected" or "Rejected"
5. Complete project and archive

## Deliverables Expected

### 1. User Guide (Markdown)
Create `docs/EVALUATOR-USER-GUIDE.md` with:
- Getting Started section
- Role-based feature overview
- Step-by-step instructions for each major feature
- Screenshots placeholders (describe what should be shown)
- Tips and best practices
- FAQ section

### 2. Manual Test Scripts (Markdown)
Create `docs/EVALUATOR-MANUAL-TEST-SCRIPTS.md` with:
- Test script format: ID, Title, Preconditions, Steps, Expected Results
- Organized by workflow phase (Setup → Requirements → ... → Selection)
- Cover happy paths AND error scenarios
- Include portal testing (vendor and client)
- Include data validation tests
- Include permission/access tests per role

### 3. Test Data Checklist
Create `docs/EVALUATOR-TEST-DATA-CHECKLIST.md` with:
- Required test users and their roles
- Sample evaluation project configuration
- Sample requirements (10-15)
- Sample vendors (3-5)
- Sample criteria framework
- Sample workshop data
- Expected scoring data for verification

## How to Explore the Application

1. **Review existing code structure:**
   ```
   src/pages/evaluator/          # All page components
   src/components/evaluator/     # Feature components organized by domain
   src/services/evaluator/       # Business logic services
   api/evaluator/                # API endpoints
   ```

2. **Key pages to understand:**
   - `EvaluatorDashboard.jsx` - Main dashboard
   - `RequirementsHub.jsx` - Requirements management
   - `VendorsHub.jsx` - Vendor pipeline
   - `WorkshopsHub.jsx` - Workshop management  
   - `EvaluationHub.jsx` - Scoring interface
   - `TraceabilityView.jsx` - Matrix and drilldowns
   - `ReportsHub.jsx` - Report generation
   - `EvaluationSettings.jsx` - Project configuration
   - `ClientPortal.jsx` - Client portal
   - `VendorPortal.jsx` - Vendor portal

3. **Database schema:**
   - Review `supabase/migrations/` folder (files starting with 202601)
   - Key tables: evaluation_projects, requirements, vendors, scores, evidence

## Output Format

Write documentation in clear, professional Markdown. Use:
- Clear headings and subheadings
- Numbered lists for steps
- Tables for structured data
- Code blocks for any technical details
- Consistent formatting throughout

## Getting Started

Begin by:
1. Reading the three key documentation files mentioned above
2. Exploring the `src/pages/evaluator/` directory to understand available pages
3. Reviewing a few key components to understand the UI patterns
4. Then start writing the User Guide, followed by Test Scripts

Focus on **user perspective** - what they see, what they click, what happens. Don't include implementation details unless necessary for understanding.
