# CSP TECHNOLOGY PROCUREMENT EXERCISE
## Full-Stack Web App Requirements: User Journeys, Use Cases & Gap Analysis

**Document:** CSP-Procurement-App-Requirements.md  
**Version:** 1.0  
**Created:** 9 January 2026  
**Project:** Carey Olsen Corporate Services - Technology Platform Selection  
**Status:** Requirements Definition Phase

---

## EXECUTIVE SUMMARY

This document defines the requirements for a full-stack procurement web application to support the Carey Olsen Corporate Services (CSP) technology platform selection exercise. The exercise involves evaluating 4 primary vendors (CSC Entity Management, Athennian, Vistra Platform, Quantios Core) across 55 requirements spanning 7 categories.

### Application Scope

The application will support the complete end-to-end procurement workflow:
- **Requirements Collection** (workshops, e-forms, stakeholder input)
- **Vendor Assessment** (RFP distribution, response management, scoring)
- **Evaluation** (AI-assisted analysis, gap identification, consensus scoring)
- **Decision Support** (scenario comparison, recommendations, reporting)

### Key Differentiators

1. **AI Integration** - Document parsing, response analysis, gap detection, recommendation generation
2. **Stakeholder Portal** - Separate interfaces for internal evaluators, client stakeholders, and vendor respondents
3. **Traceability** - Complete linkage from requirements → RFP questions → vendor responses → scores
4. **Real-Time Collaboration** - Live workshop mode with requirement capture and prioritisation

### Current State: "The Evaluator"

Your existing Tracker app includes **The Evaluator** module with:
- 29-table database schema
- 15 React frontend pages
- 18 business logic services
- 8 AI-powered API endpoints
- Multi-tenancy support
- Role-based access control

---

## PROJECT CONTEXT & SCOPE

### Business Drivers

| Driver | Impact | Timeline |
|--------|--------|----------|
| ViewPoint phase-out | Must replace within 15 months | Critical path |
| Multi-vendor evaluation | Formal RFP process required | Jan-May 2026 |
| Integration requirements | 3E, Intapp, Peppermint integration critical | Phase 2-3 |
| Compliance automation | AEOI/CRS, AML/KYC requirements | Go-live requirement |
| AI capabilities | Market trend; competitive requirement | High priority |

### Success Metrics

| Metric | Target | Baseline |
|--------|--------|----------|
| RFP completion rate | 100% | N/A |
| Vendor response quality | 4.2/5.0 average | N/A |
| Evaluation cycle time | 13 weeks | Typical: 16-20 weeks |
| Evaluator consensus agreement | 85%+ on top 3 | N/A |
| Stakeholder engagement | 95%+ requirement approval | N/A |

---

## PHASE 1: REQUIREMENTS COLLECTION

### 1.1 User Journeys: Requirements Gathering

#### UJ1.1: Business Stakeholder Contributing Requirements via Workshop

**Actor:** CSP manager, Finance team member, Compliance officer  
**Precondition:** Workshop scheduled and invitations sent  
**Trigger:** Workshop date arrival

**Journey Steps:**

1. User receives workshop invite (email with Outlook integration)
2. User accepts RSVP through invite link
3. On workshop day, user joins live collaboration session
4. Facilitator explains evaluation context and scoring framework
5. **Requirements entry mode:**
   - User clicks "Add Requirement"
   - Types requirement title and description
   - System provides real-time AI category suggestions based on text content
   - User selects category (or accepts AI suggestion)
   - User rates priority (MoSCoW: Must/Should/Could/Won't)
   - Requirement appears instantly in shared list with "new" indicator
6. User votes on other requirements (thumbs up, priority dots)
7. AI consolidation engine runs in real-time, flagging duplicates
8. Facilitator guides consolidation discussion
9. User reviews consolidated requirement set
10. Post-workshop: User completes follow-up survey (pre/post workshop questionnaire)

**Post-Condition:** Requirements captured in system with stakeholder attribution  
**Alternate Flows:**
- User joins workshop remotely (video conference link + live portal)
- User adds requirements asynchronously if live workshop not possible
- User reviews requirements later and provides comments/refinements

**AI Integration Points:**
- Real-time category suggestion based on requirement text
- Duplicate/similar requirement detection with merge suggestions
- Stakeholder perspective analysis (what this requirement implies for different teams)

---

#### UJ1.2: Business Stakeholder Submitting Requirements via E-Form

**Actor:** Finance director, IT manager, CSP partner (external)  
**Precondition:** E-form distributed (email link or portal access)  
**Trigger:** User clicks "Complete Requirements Form"

**Journey Steps:**

1. User receives email with unique e-form link
2. User opens form in browser (mobile-friendly)
3. Form shows:
   - **Section 1: Personal Context** (Name, role, stakeholder area)
   - **Section 2: Entity Management Needs** (6 questions with guidance)
   - **Section 3: Integration Requirements** (5 questions specific to 3E/Intapp/Peppermint)
   - **Section 4: Compliance Needs** (4 questions on AEOI/CRS/AML)
   - **Section 5: Technical Preferences** (3 questions on cloud/security/APIs)
4. User enters responses (text, ratings, checkboxes)
5. Form provides inline validation (e.g., "textarea requires minimum 50 characters")
6. User can save draft and return later
7. User submits form
8. System sends confirmation email to user
9. Submitted responses aggregated with workshop responses

**Post-Condition:** Individual responses captured, attributed, and available for consolidation  
**Alternate Flows:**
- User completes form on mobile device
- User requests paper form with manual data entry by team
- User completes form in session with facilitator (interviewer mode)

**Mobile Considerations:**
- Single-column layout for narrow screens
- Large touch targets for rating scales
- Auto-save every 30 seconds
- Offline capability with sync on reconnection

---

#### UJ1.3: Evaluator Consolidating Requirements into Canonical Set

**Actor:** CSP consultant, Procurement manager  
**Precondition:** Requirements collection phase complete (workshops + e-forms done)  
**Trigger:** User navigates to "Requirements Hub" > "Consolidation" tab

**Journey Steps:**

1. System displays all raw requirements (workshop + form submissions)
2. User clicks "Run AI Consolidation"
3. System analyzes all requirements for:
   - Semantic similarity (AI identifies clusters of related requirements)
   - Conflicts/contradictions (AI flags conflicting statements from different stakeholders)
   - Categorization suggestions (AI proposes optimal category for each requirement)
4. AI consolidation report displays:
   - **Duplicate Groups** (e.g., "These 3 requirements mean the same thing")
   - **Conflicts** (e.g., "Finance wants 'real-time reporting' but IT says 'daily batch is sufficient'")
   - **Auto-Grouping Suggestions** (proposed categories with drag-reorder)
5. User reviews groups and manually adjusts as needed
6. For each group, user:
   - Selects which requirement becomes "canonical" (primary)
   - Marks others as "absorbed" or "variant"
   - Adds consolidation note explaining the decision
   - Assigns weighting (some stakeholder groups weight higher)
7. User reviews conflicts with resolution guidance from AI
8. For conflicts, user documents decision (e.g., "Compromise: Real-time UI with daily batch backend")
9. User reviews proposed categories; adjusts if needed
10. User applies all suggested categorizations (bulk apply)
11. System generates consolidation report (with audit trail)
12. Consolidated requirement set exported to Requirements Hub for approval

**Post-Condition:** ~55 canonical requirements ready for client approval  
**Success Criteria:**
- Consolidated set captures 95%+ of original requirement intent
- No critical information lost in consolidation
- Clear audit trail of why requirements were merged

**AI Integration Points:**
- Semantic similarity detection (using Claude embeddings)
- Conflict detection (contradiction identification)
- Auto-categorization (LLM-based classification)
- Consolidation auditing (explain decisions in natural language)

---

### 1.2 Use Cases: Requirements Collection Phase

#### UC1: Collect stakeholder requirements via workshop

**Actors:** Facilitator, Stakeholders (Finance, IT, Compliance, CSP Partners)  
**Precondition:** Workshop scheduled  
**Flow:**
1. Facilitator starts live workshop session
2. Stakeholders join via web portal or Teams link
3. Facilitator explains evaluation context and success criteria
4. Stakeholders enter requirements in real-time via quick-add form
5. System shows live vote counts on requirements (priority/importance)
6. AI flags likely duplicates in real-time
7. Facilitator guides final prioritization discussion
8. Post-workshop: System sends follow-up questionnaire to attendees

**Post-Condition:** All workshop requirements captured and attributed to stakeholder

**Integration Requirements:**
- Outlook integration for calendar invites
- Teams/Zoom meeting link integration
- Email notifications for pre/post workshop

---

#### UC2: Distribute e-form for asynchronous requirement collection

**Actors:** Project manager, Stakeholders (can't attend workshop)  
**Precondition:** Stakeholder list defined  
**Flow:**
1. PM creates e-form with custom questions
2. PM selects stakeholders to distribute to
3. System generates unique links for each stakeholder
4. PM sends emails with links
5. Stakeholders complete forms (1-2 weeks response period)
6. PM tracks completion status with reminder automation
7. System consolidates responses

**Post-Condition:** All stakeholder requirements captured (workshop + form)

---

#### UC3: Consolidate duplicate/similar requirements using AI

**Actors:** Evaluator, CSP Consultant  
**Precondition:** Workshop + e-form collection complete  
**Flow:**
1. Evaluator navigates to Consolidation Wizard
2. System runs AI analysis on all requirements
3. Evaluator reviews AI suggestions:
   - Duplicate groups (which requirements are the same)
   - Conflicts (contradictory requirements from different teams)
   - Categorization suggestions
4. Evaluator manually approves/adjusts AI suggestions
5. For each group: select canonical requirement, document reasoning
6. System generates consolidation report with full audit trail
7. Consolidated set ready for client approval

**Post-Condition:** Clean, deduplicated set of ~55 canonical requirements

**AI Services Required:**
- `ai-consolidate-requirements` endpoint
- Semantic similarity analysis
- Conflict detection
- Categorization suggestion

---

### 1.3 Database Entities: Requirements Collection

**Tables Involved:**
- `evaluation_projects` (top-level container)
- `workshops` (facilitated sessions)
- `workshop_attendees` (RSVP tracking)
- `survey_responses` (e-form submissions)
- `requirements` (captured requirements)
- `requirement_comments` (discussion threads)

**New Tables Needed for This Phase:**
- `requirement_consolidation_groups` (track which requirements were merged)
- `requirement_consolidation_decisions` (why they were merged, audit trail)

---

## PHASE 2: VENDOR ASSESSMENT & RFP MANAGEMENT

### 2.1 User Journeys: RFP Process

#### UJ2.1: Evaluator Creating and Customizing RFP from Template

**Actor:** Procurement manager, CSP consultant  
**Precondition:** Approved requirements set (55 requirements)  
**Trigger:** User navigates to "Questions Hub"

**Journey Steps:**

1. System displays RFP template options:
   - Entity Management - General Purpose
   - Entity Management - CSP Specialized (RECOMMENDED)
   - Financial Integration - 3E Integration focus
   - Custom (blank)
2. User selects "Entity Management - CSP Specialized" template
3. Template loads with:
   - Pre-filled RFP sections (Company info, technical capabilities, pricing)
   - ~80 pre-written questions organized by category
   - Question-to-requirement linkage pre-mapped
4. User customizes template:
   - Adds custom questions specific to Carey Olsen context (integration with 3E, Intapp, Peppermint)
   - Removes non-applicable questions
   - Reorders sections based on priority
   - Marks questions as "Critical" (vendor must answer), "Important", or "Nice-to-have"
5. For each question, user can:
   - Edit guidance text for vendors
   - Edit scoring guidance for evaluators
   - Add compliance context (e.g., "This relates to AEOI requirement R12")
   - Link to one or more requirements
6. User defines response format per question:
   - Text (short, medium, long)
   - Yes/No
   - Compliance level (Fully Compliant, Partial, Non-Compliant, Not Applicable, Roadmap)
   - Attachments (RFP response, reference architecture diagram, case studies)
   - Numeric (pricing, team size, etc.)
7. User sets deadlines and submission instructions
8. User reviews complete RFP (preview mode)
9. User configures vendor portal experience:
   - Company logo/branding
   - Help text and resources
   - Q&A functionality
   - Document library (technical specs to reference)
10. User sends RFP to 4 vendors (CSC, Athennian, Vistra, Quantios)

**Post-Condition:** RFP distributed to 4 vendors; vendor portals activated with deadline tracking

**AI Integration Points:**
- Question quality scoring (suggesting improvements to ambiguous questions)
- Vendor-specific customization suggestions (based on their known strengths/weaknesses)
- Compliance mapping validation (ensuring RFP covers all critical requirements)

---

#### UJ2.2: Vendor Completing and Submitting RFP Response via Portal

**Actor:** Vendor account manager, Vendor technical team  
**Precondition:** Vendor has received RFP with unique portal link  
**Trigger:** Vendor clicks portal link in email

**Journey Steps:**

1. Vendor opens RFP portal in browser
2. Portal displays:
   - Vendor-friendly interface with Carey Olsen branding
   - RFP overview and key deadlines (response due in 6 weeks)
   - Progress bar showing completion (e.g., "3 of 25 sections complete")
   - Question count and importance badges
3. Vendor navigates through RFP sections:
   - **Section 1: Company Profile** (company info, history, size)
   - **Section 2: Product Overview** (system description, architecture, roadmap)
   - **Section 3: Entity Management** (capabilities specific to CSP use case)
   - **Section 4: Integration** (3E, Intapp, Peppermint integration details)
   - **Section 5: Technical Architecture** (cloud, security, scalability)
   - **Section 6: Compliance** (AEOI/CRS, AML/KYC automation)
   - **Section 7: Support & Services** (SLA, support model, training)
   - **Section 8: Pricing** (licensing, implementation costs, support costs)
   - **Section 9: Unique Differentiators** (why your solution is best)
4. For each question, vendor:
   - Reads question and guidance
   - Enters response (text, checkboxes, ratings)
   - Uploads supporting documents (case studies, reference architecture, compliance cert)
   - System shows real-time validation ("Response meets minimum 100-character requirement")
5. Vendor sees importance badges on questions (critical, important, nice-to-have)
   - May prioritize response time accordingly
6. Vendor can save draft and return later (auto-save every 30 seconds)
7. Vendor views "Compliance Checklist" sidebar showing:
   - Security certifications (SOC 2, ISO 27001, etc.)
   - Data residency options
   - API capabilities
   - Integration roadmap items
8. Vendor uses Q&A forum to ask clarification questions
   - Questions visible to all vendors (anonymized)
   - Evaluator team answers within 48 hours
9. 2 weeks before deadline: Automated reminder email
10. 1 week before deadline: Another reminder email
11. 24 hours before deadline: Final reminder with "Submit Now" button
12. Vendor clicks "Submit Response"
13. System validates all required fields completed
14. System sends confirmation email to vendor
15. Evaluator team receives notification: "CSC Entity Management has submitted response"

**Post-Condition:** Vendor response submitted, archived, and ready for evaluation

**Mobile Experience:**
- Responsive design for any screen size
- Single-column layout on mobile
- Large touch targets for form fields
- Progress indicator always visible
- Ability to upload documents via mobile camera

**Vendor Support:**
- Live Q&A forum with 48h response SLA
- Template answers to common questions
- Document library with reference materials
- Help videos (how to complete different question types)

---

#### UJ2.3: Evaluator Reviewing Vendor Response with AI Analysis

**Actor:** Technical evaluator, Solution architect  
**Precondition:** Vendor has submitted response  
**Trigger:** Evaluator clicks "Review Response" on vendor dashboard

**Journey Steps:**

1. Evaluator opens vendor response view
2. System displays response with:
   - Vendor name and submission date
   - Overall completion percentage
   - Question-by-question navigation
3. For each question response, evaluator sees:
   - **Response text** (vendor's answer)
   - **Supporting documents** (linked case studies, specs)
   - **AI Analysis Panel** (system-generated insights)
4. AI Analysis includes:
   - **Summary** (2-3 sentence distilled version)
   - **Key Points** (bullet-point extraction of main claims)
   - **Compliance Gaps** (areas where response is ambiguous or incomplete)
   - **Strengths** (positive differentiators)
   - **Comparison Notes** (how this compares to other vendors)
5. Evaluator scores response using guidance:
   - Reads vendor response and AI summary
   - Reviews scoring guidance ("Fully Met = vendor can do this out-of-box...")
   - Enters score (0-5 scale)
   - Enters confidence level (low/medium/high)
   - Adds written justification for score
6. Evaluator can:
   - Flag response for follow-up questioning
   - Request evidence (demo, reference call, POC)
   - Link to supporting requirement (R12: "Must have 3E integration")
   - Cross-reference with other vendors' responses
7. For each criterion, evaluator sees:
   - Average score (across all evaluators)
   - Min/Max scores (to identify consensus issues)
   - Variance indicator (if scores differ significantly)
8. Evaluator marks response as "Ready for Consensus" when complete
9. System notifies all evaluators when all individual scores submitted

**Post-Condition:** Vendor response scored and archived with full audit trail

**AI Integration Points:**
- `ai-analyze-response` endpoint (Claude analysis of text responses)
- Real-time gap detection (comparing response to requirement)
- Comparison analysis (how vendors differ on same question)
- Evidence suggestion (what additional proof would strengthen evaluation)

---

### 2.2 Use Cases: Vendor Assessment Phase

#### UC4: Create and customize RFP from template

**Actors:** Procurement manager  
**Precondition:** Approved requirements, vendor list, deadline  
**Flow:**
1. PM selects RFP template (CSP Specialized)
2. PM customizes template with Carey Olsen-specific questions
3. PM links RFP questions to requirements for traceability
4. PM sets deadlines and response format requirements
5. PM previews RFP
6. PM configures vendor portal branding and help resources
7. PM distributes RFP to 4 vendors

**Post-Condition:** RFP distributed; vendor portals active

---

#### UC5: Track vendor response status and send reminders

**Actors:** Procurement manager  
**Precondition:** RFP distributed  
**Flow:**
1. PM views vendor dashboard showing:
   - Submission status per vendor (Not started, In progress, Submitted)
   - Completion percentage per vendor
   - Days remaining for each vendor
2. System automatically sends reminder emails:
   - 2 weeks before deadline
   - 1 week before deadline
   - 24 hours before deadline
3. PM can manually send custom reminder message
4. PM tracks Q&A forum and answers vendor questions
5. PM generates status report for steering committee

**Post-Condition:** All vendors submit responses by deadline

---

#### UC6: Evaluate vendor response with AI-powered guidance

**Actors:** Evaluator (technical), Evaluator (commercial), Evaluator (functional)  
**Precondition:** Vendor response submitted  
**Flow:**
1. Evaluator opens vendor response
2. For each question, evaluator reviews:
   - Vendor response text
   - Supporting documents
   - AI-generated analysis and suggestions
3. Evaluator scores response using 0-5 scale
4. Evaluator enters confidence level
5. Evaluator documents scoring rationale
6. System tracks evaluator scores and flags high variance
7. Once all evaluators score, system calculates:
   - Average score per question
   - Consensus score per vendor per criterion
   - Overall vendor score

**Post-Condition:** Vendor response scored; individual scores ready for consensus discussion

**AI Services Required:**
- `ai-analyze-response` endpoint

---

### 2.3 Database Entities: RFP & Vendor Assessment

**Tables Involved:**
- `vendor_questions` (RFP questions)
- `vendor_question_links` (question-to-requirement mapping)
- `vendor_responses` (vendor answers)
- `vendor_documents` (case studies, specs, etc.)
- `vendors` (vendor company info)
- `vendor_contacts` (primary contact, escalation contacts)

**New Tables Needed:**
- `vendor_response_ai_analysis` (cache AI analysis results)
- `rfp_templates` (pre-built RFP templates)

---

## PHASE 3: VENDOR EVALUATION & CONSENSUS SCORING

### 3.1 User Journeys: Evaluation & Consensus

#### UJ3.1: Evaluator Team Reconciling Score Variance Through Consensus Session

**Actor:** Evaluation team lead, Technical evaluators, Commercial evaluators  
**Precondition:** All vendors scored by all evaluators  
**Trigger:** System alerts: "Score reconciliation needed on 8 criteria"

**Journey Steps:**

1. System identifies scoring variance (e.g., evaluator A scored 4, evaluator B scored 2 on same criterion)
2. Team lead receives alert with list of criteria needing reconciliation
3. Team lead schedules synchronous consensus session (30-min video call)
4. During call, facilitator (team lead) opens "Consensus Scoring Interface":
   - **Left panel:** Criterion name and scoring guidance
   - **Middle panel:** Individual evaluator scores with names/avatars
   - **Right panel:** Evidence and documentation from each evaluator
5. For first variance criterion:
   - Evaluator A explains their reasoning: "I scored 4 because Athennian demo showed real-time reporting"
   - Evaluator B explains their reasoning: "I scored 2 because their documentation doesn't mention AEOI automation"
6. Team discusses:
   - Which evidence is most compelling
   - What gaps need follow-up questioning
   - Which evaluator missed something in their analysis
7. Team votes on consensus score (simple majority)
8. If tied, team lead makes tiebreaker decision
9. Consensus score recorded with:
   - Final score (e.g., 3)
   - Decision rationale (e.g., "Good real-time reporting but AEOI automation roadmap only")
   - Contributing individual scores and names
   - Audit trail of discussion
10. System calculates updated vendor scores:
    - Per-criterion: consensus score (weighted by criterion importance)
    - Per-category: average of criteria scores
    - Overall vendor score: weighted average across all categories
11. System displays updated vendor rankings:
    - Tier 1: 4.5-5.0 (CSC: 4.5, Athennian: 4.4)
    - Tier 2: 4.0-4.5 (Vistra: 4.4, Quantios: 4.3)
    - Tier 3: 3.0-4.0
12. Team can drill into any criterion to see:
    - Individual scores and reasoning
    - Evidence supporting each score
    - Consensus decision and rationale

**Post-Condition:** Vendor scores finalized with full consensus documentation

**AI Integration Points:**
- Score variance detection (alerting on conflicts)
- Consensus recommendation (AI suggests likely consensus based on evidence)
- Rationale synthesis (drafting consensus rationale for team to refine)

---

#### UJ3.2: Evaluator Viewing Traceability Matrix (Requirements → RFP → Scores)

**Actor:** CSP consultant, Steering committee member  
**Precondition:** Evaluation complete, scores finalized  
**Trigger:** User navigates to "Traceability View" tab

**Journey Steps:**

1. System displays interactive traceability matrix:
   - **Rows:** 55 requirements (grouped by category)
   - **Columns:** 4 vendors
   - **Cells:** Colored by score (5=dark green, 4=green, 3=yellow, 2=orange, 1=red)
2. User can:
   - **Filter by category** (show only "Integration Requirements")
   - **Filter by priority** (show only "Must Have" requirements)
   - **Sort by vendor** (show which vendor scores highest)
3. User clicks on a cell (e.g., "CSC Entity Management" vs "Integration Requirements"):
   - Right panel opens showing:
     - **Requirement:** "Must have real-time 3E integration for general ledger import"
     - **Related RFP Question:** "Describe your integration approach for Elite 3E general ledger"
     - **Vendor Response:** CSC's response text
     - **Evidence:** Supporting documents (technical spec, case study)
     - **Evaluation:** Individual scores from 3 evaluators + consensus score
     - **Rationale:** Why consensus score was chosen
4. User can see:
   - **Coverage:** Which requirements each vendor can meet
   - **Gaps:** Which requirements have low scores across all vendors
   - **Differentiators:** Which requirements show big score spread
5. User can export traceability report:
   - Matrix view (spreadsheet)
   - Detailed report (requirement + RFP question + all vendor responses + all scores)
6. System highlights key insights:
   - "Vistra scores highest on real-time reporting (avg 4.6)"
   - "All vendors have gap on AEOI automation (avg 3.1)"
   - "CSC and Athennian score similarly on functional requirements (4.4 vs 4.5)"

**Post-Condition:** Complete traceability visible end-to-end

**Traceability Data Model:**
```
Requirement (R12: "Real-time 3E integration")
  ↓ (linked via requirement_criteria)
Evaluation Criterion (C7: "3E Integration Capability")
  ↓ (linked via vendor_question_links)
RFP Question (Q17: "Describe your 3E integration approach")
  ↓ (answered by)
Vendor Response (Vendor=CSC, Answer="We have REST APIs for 3E GL import")
  ↓ (scored with)
Score (CSC scored 4/5 on criterion C7)
  ↓ (consensus with)
Consensus Score (All evaluators agreed 4/5; rationale: "Good API documentation but roadmap only for real-time capability")
```

---

### 3.2 Use Cases: Evaluation & Decision Support

#### UC7: Reconcile evaluator score variance through consensus discussion

**Actors:** Evaluation team lead, Evaluators  
**Precondition:** Individual scores submitted by all evaluators  
**Flow:**
1. System identifies criteria with score variance > threshold
2. Team lead schedules consensus session
3. Team meets (virtually) and:
   - Reviews each variance criterion
   - Discusses evidence and reasoning
   - Votes on consensus score
   - Documents rationale and decision
4. System recalculates vendor scores using consensus scores
5. Updated vendor rankings reflect consensus

**Post-Condition:** Vendor scores finalized with documented consensus

---

#### UC8: View traceability matrix (requirements → RFP → scores)

**Actors:** Steering committee, Consultant  
**Precondition:** Evaluation complete  
**Flow:**
1. User opens Traceability View
2. Interactive matrix shows Requirements (rows) × Vendors (columns)
3. Cell color indicates score (red=low, green=high)
4. User clicks cell to see:
   - Original requirement
   - Related RFP question
   - Vendor response text
   - Individual scores and consensus
   - Supporting evidence and documentation
5. User can filter by category, priority, or vendor
6. System highlights key insights and coverage gaps
7. User exports traceability report

**Post-Condition:** Complete end-to-end visibility into evaluation

---

#### UC9: Generate vendor comparison and recommendation report

**Actors:** Steering committee, Executive sponsor  
**Precondition:** Evaluation complete, scores finalized  
**Flow:**
1. User navigates to "Reports" section
2. System generates comprehensive evaluation report:
   - **Executive Summary** (AI-generated 1-page summary of findings and recommendation)
   - **Vendor Comparison** (side-by-side comparison of top 3 vendors)
   - **Scoring Matrix** (detailed breakdown by category)
   - **Traceability Matrix** (requirements coverage)
   - **Strengths & Gaps** (per vendor)
   - **Risk Analysis** (integration risks, vendor viability risks)
   - **Financial Analysis** (3-year TCO comparison)
   - **Recommendation** (AI-assisted with rationale)
   - **Implementation Timeline** (high-level roadmap)
3. Steering committee reviews report
4. Executive sponsor makes final decision
5. Decision documented in system (approval + sign-off)

**Post-Condition:** Vendor decision documented and approved

**AI Services Required:**
- `generate-report` endpoint with AI executive summary
- Recommendation generation (which vendor best fits criteria)

---

### 3.3 Database Entities: Evaluation & Decision

**Tables Involved:**
- `scores` (individual evaluator scores)
- `consensus_scores` (agreed-upon consensus scores)
- `consensus_score_sources` (audit trail linking consensus to individual scores)
- `requirement_criteria` (link requirements to evaluation criteria)
- `vendor_question_links` (link questions to requirements/criteria)
- `evidence` (supporting evidence for scores)
- `score_evidence` (link scores to supporting evidence)

---

## PHASE 4: STAKEHOLDER COLLABORATION & APPROVAL

### 4.1 User Journeys: Client & Vendor Portal Access

#### UJ4.1: Client Stakeholder Accessing Client Portal for Requirements Approval

**Actor:** Carey Olsen partner, Finance director (client-side stakeholder)  
**Precondition:** Requirements consolidation complete  
**Trigger:** User receives email: "Please review and approve CSP requirements"

**Journey Steps:**

1. User clicks portal link in email (unique token-authenticated)
2. Portal loads with Carey Olsen branding
3. User sees "Requirements for Approval" dashboard:
   - 55 requirements organized by category (Entity Management, Integration, etc.)
   - Status indicators (approved, pending review, revision requested)
4. User can:
   - **View by category** (e.g., show only "Integration Requirements")
   - **View by priority** (e.g., show only "Must Have")
   - **View by stakeholder area** (e.g., requirements contributed by Finance team)
5. For each requirement, user sees:
   - Requirement title and description
   - Category and priority
   - Stakeholders who contributed/supported it
   - Links to RFP questions addressing this requirement
6. User can add comments on individual requirements:
   - "We also need real-time reconciliation reporting"
   - "This might be out of scope for Phase 1"
   - "Finance strongly supports this requirement"
7. User can:
   - Approve requirement individually ("Yes, this is correct")
   - Flag for revision ("Need to clarify the scope")
   - Request evidence ("Where did this come from?")
8. User views overall approval progress:
   - "Your team has approved 42 of 55 requirements (76%)"
   - "Pending review: 8 requirements"
   - "Revisions requested: 5 requirements"
9. User submits final approval:
   - "I approve these 55 requirements on behalf of Finance team"
   - Timestamp and signature captured
10. System notifies all stakeholders: "Finance team has approved requirements"

**Post-Condition:** Stakeholder approval recorded with full audit trail

**Mobile Considerations:**
- Portal fully responsive
- Comments accessible on mobile
- Approval status clearly visible
- Notification emails include direct approval link

---

#### UJ4.2: Vendor Portal - Post-Submission Access for Q&A and Updates

**Actor:** Vendor account manager  
**Precondition:** Vendor has submitted RFP response  
**Trigger:** Vendor logs back into portal

**Journey Steps:**

1. Vendor opens portal with previous credentials
2. Portal shows "Response Submitted" confirmation
3. Vendor can access:
   - **Response Summary** (read-only view of submitted response)
   - **Q&A Forum** (ongoing questions from evaluators)
   - **Status Updates** (evaluation progress - "Evaluators currently reviewing your response")
4. Vendor sees recent evaluator questions:
   - Q: "Can you clarify your AEOI reporting automation capabilities?"
   - A: (Vendor can respond in thread)
5. Vendor can submit supplementary information:
   - "Here's additional documentation on AEOI compliance"
   - "We've updated our roadmap to include real-time 3E integration"
6. Vendor can request briefing call:
   - "Can we schedule 30 minutes for technical deep-dive on integration?"
   - System proposes times; evaluators respond
7. Vendor receives notifications:
   - "New question from evaluation team"
   - "Clarification needed on pricing"
   - "We'd like to schedule a reference call"
8. Vendor tracks "Evaluation Status":
   - Overall: "Being evaluated by 3 assessors"
   - Category scores: "Functional: In progress, Integration: In progress"
   - Completion: "Evaluators 33% through scoring"

**Post-Condition:** Vendor can support evaluation process with clarifications and additional evidence

---

### 4.2 Use Cases: Stakeholder Management

#### UC10: Client stakeholders review and approve consolidated requirements

**Actors:** Stakeholders (Finance, IT, Compliance, CSP Partners)  
**Precondition:** Requirements consolidation complete  
**Flow:**
1. System sends approval email to stakeholders with portal link
2. Stakeholders access client portal
3. Each stakeholder reviews requirements:
   - Can view by category or priority
   - Can see which requirements their team contributed
   - Can comment and flag for revision
4. Stakeholders vote on requirement approval
5. System tracks approval percentage per stakeholder area
6. Once all stakeholder areas approve (or deadline reached), requirements are "Approved"
7. Final approved requirement set locked and used for RFP

**Post-Condition:** Client-approved requirement set ready for RFP finalization

---

#### UC11: Vendor portal post-submission access for Q&A

**Actors:** Vendors  
**Precondition:** Vendor has submitted RFP response  
**Flow:**
1. Vendor logs into portal
2. Vendor can review submitted response (read-only)
3. Vendor can respond to evaluator questions in Q&A forum
4. Vendor can submit supplementary documentation
5. Vendor can request reference call with evaluators
6. Vendor can see real-time evaluation progress

**Post-Condition:** Vendor can support evaluation process with additional clarifications

---

## PHASE 5: DECISION SUPPORT & REPORTING

### 5.1 User Journeys: Scenario Analysis & Recommendation

#### UJ5.1: Steering Committee Evaluating Scenarios and Making Final Vendor Selection

**Actor:** Executive sponsor, Steering committee chair, CFO  
**Precondition:** Vendor scores finalized, all evaluator input complete  
**Trigger:** User navigates to "Decision Support" section

**Journey Steps:**

1. System displays "Vendor Evaluation Summary":
   - **Tier 1 (4.5/5.0):** CSC Entity Management, Athennian
   - **Tier 2 (4.4/5.0):** Vistra Platform
   - **Tier 3 (4.3/5.0):** Quantios Core
   - Key differentiators highlighted per vendor

2. User can explore "Vendor Comparison" view:
   - Radar chart comparing vendors across key categories (Functional, Integration, Technical, Compliance, Support, Cost)
   - Heatmap showing strengths and gaps per vendor
   - Narrative comparison ("Vendor A is stronger on integration; Vendor B is stronger on user experience")

3. User can analyze different "Scenarios":
   - **Scenario 1 - Baseline:** Current weightings (Integration 30%, Functional 36%, etc.)
   - **Scenario 2 - Integration-First:** Increase integration weight to 50% (vendor scores shift)
   - **Scenario 3 - Cost-Conscious:** Adjust pricing to 20% weight instead of 13% (vendor scores shift)
4. System shows how vendor rankings change per scenario:
   - "If Integration is 50% weight, Vistra rises to 4.5 (from 4.4)"
   - "If Cost is higher weight, Quantios rises to 4.4 (from 4.3)"
5. User can export scenario comparison report

6. User reviews "Risk Assessment" per vendor:
   - **CSC:** Low vendor risk (established Fortune 500), medium integration risk (new platform)
   - **Athennian:** Medium vendor risk (growth-stage), low integration risk (modern APIs)
   - **Vistra:** Medium vendor risk (recent merger), medium integration risk
   - **Quantios:** Low vendor risk (established), high integration risk (complex legacy transition)

7. User reviews "Financial Analysis":
   - **3-Year Total Cost of Ownership** per vendor
   - Breakdown: Year 1 (implementation) vs Years 2-3 (operations)
   - Cost sensitivity analysis: "If implementation runs 10% over budget, total cost would be £XXk"

8. System generates "Recommendation Report":
   - AI-drafted recommendation (e.g., "CSC Entity Management recommended as best overall fit")
   - Rationale supporting recommendation
   - Alternative scenarios if preference changes
   - Implementation risks and mitigations
   - Next steps (commercial negotiation, reference calls, etc.)

9. Steering committee discusses and votes on vendor selection

10. Selected vendor documented:
    - **Decision:** "CSC Entity Management selected"
    - **Approved by:** Executive Sponsor (name, date)
    - **Rationale:** "Best balance of stability (4.5 score), integration capability (4.4 on Integration), and proven support"
    - **Audit trail:** All supporting data, scores, and decision factors

**Post-Condition:** Final vendor selection documented and approved

**AI Integration Points:**
- Scenario recommendation ("Given these criteria, CSC is optimal")
- Risk assessment synthesis
- Recommendation generation with rationale

---

### 5.2 Use Cases: Decision Support

#### UC12: Compare vendor scenarios and analyze sensitivity

**Actors:** Steering committee, CFO  
**Precondition:** Vendor scores finalized  
**Flow:**
1. User opens Decision Support dashboard
2. User creates scenarios with different weightings:
   - Baseline: current weights (Integration 30%, Functional 36%, etc.)
   - Integration-First: increase integration weight to 50%
   - Cost-Conscious: increase cost weight to 20%
3. System recalculates vendor scores per scenario
4. User compares rankings across scenarios
5. User exports scenario analysis report
6. Steering committee uses scenarios to align on priorities

**Post-Condition:** Vendor selection decision informed by scenario analysis

---

#### UC13: Generate executive recommendation report

**Actors:** Steering committee  
**Precondition:** Evaluation complete, scenarios analyzed  
**Flow:**
1. System generates comprehensive recommendation report:
   - Executive summary (AI-generated)
   - Vendor comparison and rankings
   - Detailed scoring analysis
   - Risk assessment per vendor
   - Financial analysis (3-year TCO)
   - Recommendation with rationale
   - Implementation roadmap
   - Critical success factors
2. Steering committee reviews report
3. Executive sponsor approves recommendation
4. Decision documented with approval signatures

**Post-Condition:** Final vendor selection approved and documented

**AI Services Required:**
- `generate-report` endpoint
- Executive summary generation (AI)
- Recommendation synthesis (AI)

---

## GAP ANALYSIS: "THE EVALUATOR" vs CSP PROCUREMENT REQUIREMENTS

### Summary Table

| Feature Category | Your Evaluator App | CSP Procurement Needs | Gap | Priority |
|---|---|---|---|---|
| **Requirements Management** |  |  |  |  |
| Requirement capture (text-based) | ✓ Built | ✓ Required | None | - |
| AI categorization suggestion | ✓ In Roadmap (v1.1) | ✓ Required | Minor | HIGH |
| AI consolidation (duplicate detection) | ✓ In Roadmap (v1.3) | ✓ Required | Medium | HIGH |
| Requirement approval workflow | ✓ Built | ✓ Required | None | - |
| E-form distribution | ✓ Via surveys | ✓ Required | Minor | MEDIUM |
| **Workshop Management** |  |  |  |  |
| Workshop scheduling | ✓ Built | ✓ Required | None | - |
| Live collaboration (Supabase Realtime) | ✓ In Roadmap (v1.3) | ✓ Required | Medium | HIGH |
| Real-time requirement entry | ✓ In Roadmap (v1.3) | ✓ Required | Medium | HIGH |
| Live voting/prioritization | ✗ Not planned | ✓ Required | HIGH | HIGH |
| Real-time duplicate detection | ✗ Not planned | ✓ Required | HIGH | HIGH |
| **RFP Management** |  |  |  |  |
| RFP question templates | ✓ In Roadmap (v1.2) | ✓ Required | Minor | HIGH |
| Question customization | Partial | ✓ Required | Medium | HIGH |
| Question-to-requirement linking | ✓ Built | ✓ Required | None | - |
| RFP distribution to vendors | ✗ Not in Evaluator | ✓ Required | HIGH | HIGH |
| Vendor portal access | ✓ Designed | ✓ Required | None | - |
| Response deadline tracking | ✓ Built | ✓ Required | None | - |
| **Vendor Response Management** |  |  |  |  |
| Vendor response capture | ✓ Built | ✓ Required | None | - |
| Response upload (documents) | ✓ Built | ✓ Required | None | - |
| Response validation | Partial | ✓ Required | Medium | HIGH |
| AI response analysis | ✓ In Roadmap (v1.1) | ✓ Required | Minor | HIGH |
| Response comparison (cross-vendor) | Partial | ✓ Required | Medium | HIGH |
| Q&A forum (post-submission) | ✗ Not planned | ✓ Required | HIGH | HIGH |
| **Evaluation & Scoring** |  |  |  |  |
| Individual evaluator scoring | ✓ Built | ✓ Required | None | - |
| Score evidence tracking | ✓ Built | ✓ Required | None | - |
| Consensus scoring mechanism | ✓ Built | ✓ Required | None | - |
| Score variance detection | ✓ In Roadmap | ✓ Required | Minor | HIGH |
| Score reconciliation UI | ✓ In Roadmap | ✓ Required | Minor | HIGH |
| **Traceability** |  |  |  |  |
| Requirement-to-Criteria mapping | ✓ Built | ✓ Required | None | - |
| Criteria-to-Question mapping | ✓ Built | ✓ Required | None | - |
| Question-to-Response tracking | ✓ Built | ✓ Required | None | - |
| Response-to-Score linking | ✓ Built | ✓ Required | None | - |
| Traceability matrix view | ✓ Built | ✓ Required | None | - |
| **AI Integration** |  |  |  |  |
| Document parsing | ✓ In Roadmap (v1.1) | ✓ Required | Minor | HIGH |
| Gap analysis | ✓ Built | ✓ Required | None | - |
| Requirement suggestions | ✓ In Roadmap (v1.1) | ✓ Required | Minor | HIGH |
| Response analysis & summarization | ✓ In Roadmap (v1.1) | ✓ Required | Minor | HIGH |
| Compliance gap detection | ✓ In Roadmap (v1.1) | ✓ Required | Minor | HIGH |
| Recommended score suggestions | ✗ Not planned | ✓ Required | HIGH | HIGH |
| Executive summary generation | ✓ In Roadmap (v1.2) | ✓ Required | Minor | HIGH |
| Recommendation synthesis | ✗ Not planned | ✓ Required | HIGH | HIGH |
| **Reporting & Analytics** |  |  |  |  |
| Score heatmap | ✓ In Roadmap (v1.1) | ✓ Required | Minor | MEDIUM |
| Vendor comparison radar | ✓ In Roadmap (v1.1) | ✓ Required | Minor | MEDIUM |
| Scenario comparison | ✓ In Roadmap (v1.2) | ✓ Required | None | MEDIUM |
| PDF report generation | ✓ In Roadmap (v1.2) | ✓ Required | Minor | HIGH |
| Stakeholder participation charts | ✓ In Roadmap (v1.1) | ✓ Required | None | MEDIUM |
| **Stakeholder Portals** |  |  |  |  |
| Client portal (requirements approval) | ✗ Not planned | ✓ Required | HIGH | HIGH |
| Vendor portal (response submission) | ✓ Built | ✓ Required | None | - |
| Post-submission Q&A | ✗ Not planned | ✓ Required | HIGH | HIGH |
| Portal access token management | ✓ Built | ✓ Required | None | - |
| **User Roles & Permissions** |  |  |  |  |
| Role-based access control | ✓ Built | ✓ Required | None | - |
| Blinded scoring (optional) | ✗ Not in Evaluator | ✓ Nice-to-Have | MEDIUM | LOW |
| Granular category permissions | ✗ Not planned | ✓ Nice-to-Have | MEDIUM | LOW |
| **Project Management** |  |  |  |  |
| Project status tracking | ✓ Built | ✓ Required | None | - |
| Timeline visualization | ✓ In Roadmap (v1.1) | ✓ Required | Minor | MEDIUM |
| Risk tracking | ✗ Not in Evaluator | ✓ Required | HIGH | MEDIUM |
| Issue tracking | ✗ Not in Evaluator | ✓ Required | HIGH | MEDIUM |

---

### High-Priority Gaps (Must Build for CSP Project)

**Gap 1: Live Collaboration Features**
- **Requirement:** Real-time requirement entry during workshops with live vote count and duplicate detection
- **Current State:** Workshops table exists, but no real-time Supabase subscription for live updates
- **Build Effort:** 56 hours (from v1.3 roadmap)
- **Recommendation:** Prioritize for v1.1 release (move from v1.3)

---

**Gap 2: AI Recommended Scoring**
- **Requirement:** AI suggests score for each vendor response based on response quality and completeness
- **Current State:** Response analysis exists; score suggestion doesn't
- **Enhancement Needed:** 
  - AI analysis endpoint should output `suggestedScore` field
  - UI should display suggested score alongside manual entry
  - Evaluator can accept, modify, or override suggestion
- **Build Effort:** 8 hours (API endpoint) + 4 hours (UI)
- **Recommendation:** Add to v1.1 release

---

**Gap 3: Client Approval Portal**
- **Requirement:** Separate portal for internal stakeholders to review/approve requirements
- **Current State:** Vendor portal exists; no internal client portal
- **Build Effort:** 20 hours (new portal page + token auth + comments)
- **Recommendation:** Build as standalone feature before CSP project kick-off

---

**Gap 4: Post-Submission Q&A Forum**
- **Requirement:** Vendors can ask questions in Q&A forum post-submission; evaluators respond
- **Current State:** No Q&A mechanism exists
- **Build Effort:** 12 hours (database table, service, UI components, real-time notifications)
- **Recommendation:** Build before RFP distribution (Phase 2)

---

**Gap 5: AI Recommendation Generation**
- **Requirement:** System suggests which vendor to select based on scores, risk, and cost
- **Current State:** No recommendation AI endpoint exists
- **Build Effort:** 12 hours (API endpoint with Claude) + 6 hours (UI to display recommendation)
- **Recommendation:** Build for Phase 5 (Decision Support)

---

**Gap 6: Risk & Issue Tracking**
- **Requirement:** Track procurement project risks and issues with mitigation plans
- **Current State:** Not in Evaluator module
- **Build Effort:** 20 hours (database tables, service, UI pages)
- **Recommendation:** Build as Phase 4 feature (optional but valuable for CSP project)

---

### Medium-Priority Gaps (Nice-to-Have for CSP Project)

| Gap | Requirement | Build Effort | Recommendation |
|---|---|---|---|
| Response comparison view | See side-by-side vendor responses to same question | 8h | v1.1 enhancement |
| Blinded scoring option | Hide other evaluator scores during individual scoring | 6h | v1.1 enhancement |
| Vendor intelligence API | Auto-populate vendor company data from external sources | 40h | v2.0 feature |
| Stakeholder participation analytics | Track who contributed requirements, participated in approvals | 6h | v1.1 dashboard widget |
| Email notifications | Smart notifications for key procurement milestones | 36h | v1.1 feature |

---

## IMPLEMENTATION ROADMAP: CSP PROCUREMENT PROJECT

### Timeline Overview

| Phase | Duration | Key Deliverables | Status |
|-------|----------|-----------------|--------|
| **Phase 0: Requirements & Gaps (Current)** | 2 weeks | This document + gap analysis | IN PROGRESS |
| **Phase 1: Platform Enhancements** | 4 weeks | Build 6 high-priority gaps | PLANNED |
| **Phase 2: CSP Project Execution** | 20 weeks | Requirements → RFP → Evaluation | PLANNED |
| **Phase 3: Post-Project Refinement** | 2 weeks | Final polish, documentation | PLANNED |

---

### Phase 1: Platform Enhancement (4 Weeks - Before CSP Project Kick-Off)

**Priority 1: Live Collaboration (Week 1)**
- Real-time requirement entry with Supabase Realtime
- Live vote count display
- Real-time duplicate detection alerts
- Facilitator controls (pause for discussion, lock for final voting)
- **Build Effort:** 40 hours
- **Dependencies:** Supabase Realtime (already available)

**Priority 2: AI Response Analysis Enhancements (Week 1-2)**
- Add `suggestedScore` field to response analysis
- Display suggested score in evaluation UI
- Train evaluators on score suggestion confidence levels
- **Build Effort:** 12 hours

**Priority 3: Client Approval Portal (Week 2)**
- New portal page for internal stakeholders
- Requirements displayed with category/priority filters
- Comment and approval voting
- Stakeholder area dashboard (Finance approved 42/55, etc.)
- **Build Effort:** 20 hours

**Priority 4: Post-Submission Q&A Forum (Week 3)**
- Q&A table in database
- Real-time Q&A updates
- Vendor and evaluator interfaces
- Q&A notification emails
- **Build Effort:** 12 hours

**Priority 5: AI Recommendation Generation (Week 4)**
- Recommendation API endpoint (Claude-powered)
- Recommendation UI display
- Scenario recommendation (AI suggests best vendor per scenario)
- **Build Effort:** 18 hours

**Priority 6: Email Notifications (Week 4)**
- Smart notification system
- Key milestones (workshop reminder, RFP deadline, scores ready, decision time)
- Customizable notification preferences
- **Build Effort:** 16 hours

**Total Phase 1 Build Effort:** 118 hours (~3 weeks at 40h/week developer time)

---

### Phase 2: CSP Project Execution (20 Weeks)

**Week 1-2: Project Setup**
- Create evaluation project in app
- Define 55 requirements (input to system)
- Set up stakeholder areas (Finance, IT, Compliance, CSP Partners)
- Configure scoring scale and evaluation categories
- Create evaluation team (assign roles and permissions)

**Week 3-4: Requirements Collection**
- Run workshop #1 (Finance stakeholders)
- Run workshop #2 (IT stakeholders)
- Distribute e-forms to 20+ stakeholders
- Use live collaboration features to capture requirements
- AI consolidation of 80+ raw requirements

**Week 5-6: Requirement Approval**
- Client portal activation
- Stakeholder review and approval of consolidated requirements
- Revision requests handled
- Final 55-requirement set locked

**Week 7-8: RFP Development**
- Select and customize RFP template
- Write 80+ RFP questions
- Link questions to requirements
- Configure vendor portal experience
- Review RFP with internal team

**Week 9-10: RFP Distribution & Vendor Support**
- Distribute RFP to CSC, Athennian, Vistra, Quantios
- Monitor submission status
- Respond to vendor Q&A
- Send reminders
- All vendors submit responses by deadline

**Week 11-14: Evaluation & Scoring**
- Evaluate all 4 vendor responses (3 evaluators × 4 vendors × 80 questions)
- Use AI response analysis for each response
- Score individually
- Identify score variance (red-flag criteria)
- Consensus sessions (3-4 sessions)
- Finalize consensus scores

**Week 15-16: Analysis & Reporting**
- Generate traceability matrix
- Create vendor comparison reports
- Analyze scenarios (Integration-First, Cost-Conscious, etc.)
- AI-generated recommendation report
- Risk assessment per vendor
- Financial analysis (3-year TCO)

**Week 17-18: Decision Support**
- Present findings to steering committee
- Discuss scenarios and risk factors
- AI recommendation reviewed
- Final vendor selection voted on
- Decision documented

**Week 19-20: Wrap-Up**
- Prepare project closure report
- Document lessons learned
- Plan for Phase 2 (commercial negotiation with selected vendor)

---

## DETAILED USE CASE SPECIFICATIONS

### Complete Use Case Map

**Phase 1: Requirements Collection**
- UC1: Collect stakeholder requirements via workshop (Live collaboration)
- UC2: Distribute e-form for asynchronous requirement collection
- UC3: Consolidate duplicate/similar requirements using AI

**Phase 2: Vendor Assessment**
- UC4: Create and customize RFP from template
- UC5: Track vendor response status and send reminders
- UC6: Evaluate vendor response with AI-powered guidance

**Phase 3: Evaluation & Decision**
- UC7: Reconcile evaluator score variance through consensus discussion
- UC8: View traceability matrix (requirements → RFP → scores)
- UC9: Generate vendor comparison and recommendation report

**Phase 4: Stakeholder Collaboration**
- UC10: Client stakeholders review and approve consolidated requirements
- UC11: Vendor portal post-submission access for Q&A

**Phase 5: Decision Support**
- UC12: Compare vendor scenarios and analyze sensitivity
- UC13: Generate executive recommendation report

---

## DATABASE ENHANCEMENTS NEEDED

### New Tables for CSP Project

```sql
-- 1. Client Portal Support
CREATE TABLE client_portal_access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID REFERENCES evaluation_projects(id),
  stakeholder_area_id UUID REFERENCES stakeholder_areas(id),
  access_token VARCHAR(255) UNIQUE NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Q&A Forum Support
CREATE TABLE vendor_qa_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID REFERENCES evaluation_projects(id),
  vendor_id UUID REFERENCES vendors(id),
  question_text TEXT NOT NULL,
  asked_by VARCHAR(100), -- Vendor name or "Anonymous" if hidden
  asked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vendor_qa_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES vendor_qa_threads(id),
  answer_text TEXT NOT NULL,
  answered_by UUID REFERENCES profiles(id),
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Risk & Issue Tracking
CREATE TABLE procurement_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID REFERENCES evaluation_projects(id),
  risk_title VARCHAR(255) NOT NULL,
  risk_description TEXT,
  probability VARCHAR(20), -- low, medium, high
  impact VARCHAR(20), -- low, medium, high
  mitigation_plan TEXT,
  owner_id UUID REFERENCES profiles(id),
  status VARCHAR(50) DEFAULT 'identified', -- identified, mitigation_in_progress, mitigated, escalated
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE procurement_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID REFERENCES evaluation_projects(id),
  issue_title VARCHAR(255) NOT NULL,
  issue_description TEXT,
  priority VARCHAR(20), -- low, medium, high, critical
  resolution_plan TEXT,
  owner_id UUID REFERENCES profiles(id),
  status VARCHAR(50) DEFAULT 'open', -- open, in_progress, resolved, closed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Requirement Consolidation Audit Trail
CREATE TABLE requirement_consolidation_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_project_id UUID REFERENCES evaluation_projects(id),
  canonical_requirement_id UUID REFERENCES requirements(id),
  group_name VARCHAR(255),
  consolidation_type VARCHAR(50), -- duplicate, conflict, variant
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE requirement_consolidation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES requirement_consolidation_groups(id),
  requirement_id UUID REFERENCES requirements(id),
  role VARCHAR(20), -- canonical, absorbed, variant
  consolidation_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API ENDPOINTS NEEDED

### New Endpoints for CSP Project

```
POST /api/evaluator/ai-consolidate-requirements
Analyze all requirements for duplicates and conflicts
Input: evaluationProjectId
Output: { duplicates: [], conflicts: [], suggestions: [] }
Effort: 8h

POST /api/evaluator/ai-recommend-vendor
Generate recommendation for vendor selection
Input: evaluationProjectId, includeScenarios: boolean
Output: { recommendation: { vendor: "...", rationale: "...", confidence: 0.85 } }
Effort: 12h

POST /api/evaluator/generate-recommendation-report
Generate comprehensive recommendation report with executive summary
Input: evaluationProjectId, format: "pdf" | "docx" | "html"
Output: Binary PDF/DOCX or HTML
Effort: 16h (includes PDF generation upgrade)

POST /api/evaluator/qa-forum/ask-question
Vendor posts question in Q&A forum
Input: vendorId, evaluationProjectId, questionText
Output: { threadId: "...", created_at: "..." }
Effort: 4h

POST /api/evaluator/qa-forum/answer-question
Evaluator answers vendor question
Input: threadId, answerText, evaluatorId
Output: { answerId: "...", created_at: "..." }
Effort: 4h

POST /api/evaluator/client-portal/validate-token
Validate client portal access token
Input: token
Output: { valid: true, stakeholderAreaId: "...", expiresAt: "..." }
Effort: 2h

POST /api/evaluator/risk/create-risk
Create project risk entry
Input: evaluationProjectId, riskTitle, description, probability, impact, mitigation
Output: { riskId: "...", created_at: "..." }
Effort: 3h

GET /api/evaluator/analytics/vendor-comparison
Get comparative data for vendors (scores per category, TCO, timeline)
Input: evaluationProjectId, vendorIds: []
Output: { vendors: [ { name: "...", scores: {...}, tco: 0, timeline: "..." } ] }
Effort: 6h
```

**Total New Endpoint Effort:** 55 hours

---

## SECURITY & ACCESS CONTROL

### Role-Based Access Matrix

| Role | Requirements | RFP Mgmt | Evaluation | Approval | Admin |
|------|---|---|---|---|---|
| **Project Owner** | R/W | R/W | R/W | R/W | R/W |
| **Admin** | R/W | R/W | R/W | R/W | R |
| **Evaluator** | R | R | R/W | - | - |
| **Vendor Liaison** | R | R/W | - | - | - |
| **Observer** | R | R | R | - | - |
| **Client Stakeholder** | R (portal) | - | - | R/W | - |
| **Vendor** | - | - | - | - | - (vendor portal) |

### Portal Security

**Client Portal:**
- Token-based authentication (unique per stakeholder area)
- 12-hour expiration default (configurable)
- Rate limiting on portal endpoints
- IP whitelist option (per client)
- Audit logging of all approvals

**Vendor Portal:**
- Token-based authentication (unique per vendor)
- 90-day expiration (from RFP distribution)
- Read-only access to their responses
- Can post questions but not see other vendors' answers
- All submissions timestamped and immutable post-submission

---

## SUCCESS CRITERIA & ACCEPTANCE

### Project Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|---|
| **Requirement Coverage** | 100% of RFP questions link to ≥1 requirement | Traceability matrix audit |
| **Stakeholder Participation** | 95%+ of requirements approved by stakeholders | Client portal approval tracking |
| **Vendor Response Rate** | 100% (4 of 4 vendors) | Vendor submission tracker |
| **Evaluation Consensus** | 85%+ evaluator agreement on final scores | Consensus score variance |
| **Evaluation Timeline** | 13 weeks total (target) | Project schedule vs actual |
| **AI Analysis Accuracy** | 90%+ evaluator confidence in AI suggestions | Post-evaluation survey |
| **Report Quality** | 4.5/5 steering committee satisfaction | Executive feedback form |
| **Data Integrity** | 0 data loss incidents, 100% audit trail | System logs verification |

---

## RISK ASSESSMENT

### High-Risk Items (CSP Project Context)

| Risk | Probability | Impact | Mitigation |
|------|---|---|---|
| Integration complexity (3E, Intapp) | Medium | High | Early technical deep-dive with vendors; POC if needed |
| Stakeholder alignment on requirements | Medium | High | Multiple workshops; comprehensive e-form campaign |
| Vendor response quality | Low | Medium | Detailed RFP guidance; Q&A support during response window |
| Evaluator consistency | Medium | Medium | Comprehensive scorer training; consensus sessions |
| Scope creep (features beyond 55 requirements) | High | Medium | Strict scope definition; Change Control Board for additions |
| Timeline slippage | Low | High | Weekly status tracking; agile scope management |
| AI suggestion accuracy | Medium | Low | Tuning prompts; evaluators review suggestions before use |

---

## CONCLUSION & NEXT STEPS

### Current State Assessment

Your "Evaluator" module provides a strong foundation with 70%+ of required functionality built or planned. The remaining 30% includes critical gaps that must be addressed before the CSP project launch:

**Must-Build Before Launch:**
1. Live collaboration features (workshops) → 40h
2. AI recommended scoring → 12h
3. Client approval portal → 20h
4. Post-submission Q&A forum → 12h
5. AI recommendation generation → 18h
6. Email notifications → 16h

**Total Build Effort:** ~118 hours (~3 weeks dev time)

### Immediate Actions

1. **This Week:**
   - Executive review of this requirements document
   - Confirm budget and timeline for Phase 1 platform enhancements
   - Assign development resources (1 FTE recommended)

2. **Next 2 Weeks:**
   - Begin Phase 1 platform enhancements (priority 1-2)
   - Prepare CSP project kick-off materials
   - Recruit and train evaluation team

3. **Week 3-4:**
   - Complete Phase 1 platform enhancements
   - Create evaluation project structure in app
   - Populate 55 requirements from strategy documents
   - Configure stakeholder areas and evaluation criteria

4. **Week 5-6 (Go-Live with Requirements Collection):**
   - Launch requirements workshops
   - Distribute e-forms
   - Begin live consolidation using new AI tools

### Success Factors

✓ Executive sponsorship from senior partner level  
✓ Dedicated platform development resources (40h/week)  
✓ Comprehensive stakeholder engagement across Carey Olsen  
✓ Robust integration testing with 3E/Intapp/Peppermint context  
✓ Clear change management and communication plan  
✓ Iterative feedback loops with evaluation team  

---

**Prepared by:** AI Project Assistant  
**Date:** 9 January 2026  
**Classification:** Internal Use - Project Team

*Document version 1.0 - Ready for Review*