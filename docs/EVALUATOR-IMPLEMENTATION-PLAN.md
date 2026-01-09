# Evaluator Module - Implementation Plan

**Document Version:** 1.0
**Date:** January 9, 2026
**Based On:** EVALUATOR-GAP-ANALYSIS.md
**Total Estimated Effort:** 22-30 weeks (1 developer)

---

## Executive Summary

This implementation plan addresses all gaps identified in the gap analysis to make the Evaluator module customer-ready for strategic IT procurement exercises. The plan is organized into 4 phases:

| Phase | Focus | Duration | Outcome |
|-------|-------|----------|---------|
| **Phase 1** | Customer-Ready MVP | 4-6 weeks | Can run a real procurement |
| **Phase 2** | Efficiency & Templates | 4-6 weeks | Faster setup, better UX |
| **Phase 3** | Advanced AI & Collaboration | 6-8 weeks | Differentiated features |
| **Phase 4** | Enterprise Features | 8-10 weeks | Large-scale support |

---

## Phase 1: Customer-Ready MVP

**Goal:** Address critical gaps to support a real strategic procurement exercise
**Duration:** 4-6 weeks
**Priority:** P1 - Critical

### Feature 1.1: Smart Notifications & Deadline Reminders

**Problem:** No automated reminders for deadlines, requiring manual follow-up

**Scope:**
- Configurable reminder schedules (7 days, 3 days, 1 day before deadline)
- Vendor response deadline reminders
- Evaluator scoring deadline reminders
- Requirement approval reminders
- Reconciliation meeting reminders
- In-app notification center
- Email notification delivery
- Escalation paths (notify admin if deadline missed)

**Technical Approach:**
```
Database:
- notification_schedules (evaluation_project_id, event_type, days_before, enabled)
- notifications (id, user_id, type, title, message, read, created_at)
- notification_preferences (user_id, email_enabled, in_app_enabled, types[])

Backend:
- Cron job to check upcoming deadlines daily
- Queue notifications for delivery
- Email templates for each notification type
- WebSocket for real-time in-app notifications

Frontend:
- NotificationCenter component (bell icon in header)
- NotificationPreferences in user settings
- DeadlineConfiguration in evaluation settings
```

**Implementation Steps:**

| Step | Task | Effort | Dependencies |
|------|------|--------|--------------|
| 1.1.1 | Create notification database tables and RLS policies | 4h | None |
| 1.1.2 | Build NotificationService with CRUD operations | 4h | 1.1.1 |
| 1.1.3 | Create email templates (vendor deadline, evaluator deadline, approval needed) | 6h | None |
| 1.1.4 | Build cron job API endpoint for deadline checking | 8h | 1.1.2 |
| 1.1.5 | Build NotificationCenter component (header bell) | 6h | 1.1.2 |
| 1.1.6 | Build NotificationPreferences UI | 4h | 1.1.2 |
| 1.1.7 | Add deadline configuration to EvaluationSettings | 4h | 1.1.1 |
| 1.1.8 | Integrate Vercel Cron for scheduled execution | 4h | 1.1.4 |
| 1.1.9 | Add real-time notifications via Supabase Realtime | 6h | 1.1.2 |
| 1.1.10 | Testing and refinement | 4h | All |

**Total Effort:** 50 hours (~1.5 weeks)

**Acceptance Criteria:**
- [ ] Vendors receive email reminders at 7, 3, 1 days before deadline
- [ ] Evaluators receive reminders for incomplete scoring
- [ ] Client stakeholders receive approval reminders
- [ ] Users can configure notification preferences
- [ ] Admin notified when deadlines are missed
- [ ] In-app notification badge shows unread count

---

### Feature 1.2: Scoring Lock Mechanism

**Problem:** Scores can be changed after evaluation is supposed to be closed, affecting integrity

**Scope:**
- Lock scoring at evaluation level (all vendors, all criteria)
- Lock scoring per vendor (when vendor evaluation complete)
- Lock scoring per category (when category scoring complete)
- Visual indicators for locked status
- Admin override capability with audit trail
- Lock/unlock history tracking

**Technical Approach:**
```
Database:
- evaluation_projects: add scoring_locked_at, scoring_locked_by
- vendors: add scoring_locked_at, scoring_locked_by
- evaluation_categories: add scoring_locked_at, scoring_locked_by
- scoring_lock_history (id, entity_type, entity_id, action, user_id, reason, timestamp)

Frontend:
- Lock button on EvaluationHub, VendorDetail, CategoryView
- Lock indicator badges
- "Evaluation Locked" banner when viewing locked items
- Admin unlock modal with reason field
```

**Implementation Steps:**

| Step | Task | Effort | Dependencies |
|------|------|--------|--------------|
| 1.2.1 | Add lock columns to database tables | 2h | None |
| 1.2.2 | Create scoring_lock_history table | 2h | None |
| 1.2.3 | Update ScoresService to check lock status before save | 4h | 1.2.1 |
| 1.2.4 | Add lock/unlock methods to ScoresService | 4h | 1.2.1 |
| 1.2.5 | Build LockIndicator component | 3h | None |
| 1.2.6 | Build LockScoringModal component | 4h | 1.2.4 |
| 1.2.7 | Add lock controls to EvaluationHub | 4h | 1.2.5, 1.2.6 |
| 1.2.8 | Add lock controls to VendorDetail scoring tab | 3h | 1.2.5, 1.2.6 |
| 1.2.9 | Build lock history view for audit | 4h | 1.2.2 |
| 1.2.10 | Testing and edge cases | 3h | All |

**Total Effort:** 33 hours (~1 week)

**Acceptance Criteria:**
- [ ] Admin can lock scoring at evaluation, vendor, or category level
- [ ] Locked scores cannot be modified (UI disabled, API rejected)
- [ ] Clear visual indicator when viewing locked items
- [ ] Admin can unlock with mandatory reason
- [ ] Full audit trail of lock/unlock actions
- [ ] Existing scores preserved when locked

---

### Feature 1.3: Blind Scoring Mode

**Problem:** Evaluators can see each other's scores before submitting, creating bias

**Scope:**
- Evaluation-level setting: "Enable blind scoring"
- When enabled, evaluators cannot see other scores until:
  - They have submitted their own score, OR
  - Reconciliation phase begins
- Admin/lead evaluator always sees all scores
- Visual indicator showing blind mode is active
- Reveal mechanism when reconciliation starts

**Technical Approach:**
```
Database:
- evaluation_projects: add blind_scoring_enabled, blind_scoring_reveal_at

Service:
- ScoresService.getScores(): filter based on blind mode
  - If blind_scoring_enabled AND user hasn't scored AND not admin
  - Return only user's own scores
  - Hide other evaluators' scores and notes

Frontend:
- BlindScoringToggle in EvaluationSettings
- BlindModeIndicator on scoring interface
- "Submit to reveal others' scores" messaging
- Reconciliation view reveals all scores
```

**Implementation Steps:**

| Step | Task | Effort | Dependencies |
|------|------|--------|--------------|
| 1.3.1 | Add blind_scoring columns to evaluation_projects | 1h | None |
| 1.3.2 | Update ScoresService.getScores() with blind logic | 6h | 1.3.1 |
| 1.3.3 | Update ScoresService.getVariance() with blind logic | 3h | 1.3.1 |
| 1.3.4 | Build BlindScoringToggle component | 3h | None |
| 1.3.5 | Add blind mode to EvaluationSettings | 2h | 1.3.4 |
| 1.3.6 | Build BlindModeIndicator component | 2h | None |
| 1.3.7 | Update ScoringInterface to show blind indicators | 4h | 1.3.6 |
| 1.3.8 | Update ReconciliationPanel to reveal scores | 3h | 1.3.2 |
| 1.3.9 | Add "reveal" trigger when reconciliation starts | 3h | 1.3.1 |
| 1.3.10 | Testing with multiple evaluators | 4h | All |

**Total Effort:** 31 hours (~1 week)

**Acceptance Criteria:**
- [ ] Admin can enable blind scoring in evaluation settings
- [ ] Evaluators see only their own scores until submitted
- [ ] After submitting, evaluator sees all scores for that criterion
- [ ] Admin/lead evaluator always sees all scores
- [ ] Clear messaging about blind mode status
- [ ] Reconciliation view shows all scores regardless

---

### Feature 1.4: Vendor Q&A Management

**Problem:** Cannot handle clarification questions from vendors during RFP period

**Scope:**
- Vendors can submit questions via portal
- Questions routed to evaluation team
- Team can respond with answer
- Option to share Q&A with all vendors (anonymized)
- Q&A deadline separate from response deadline
- Q&A visible in vendor portal

**Technical Approach:**
```
Database:
- vendor_qa (
    id, evaluation_project_id, vendor_id,
    question_text, question_date, question_status,
    answer_text, answer_date, answered_by,
    is_shared, shared_at
  )
- evaluation_projects: add qa_deadline

Frontend (Vendor Portal):
- "Ask a Question" button
- QASubmissionForm component
- QAHistory component (view own Q&A and shared Q&A)

Frontend (Consultant):
- QAManagementHub page (/evaluator/qa)
- QAResponseForm component
- ShareQAModal component
- QA count badge in sidebar
```

**Implementation Steps:**

| Step | Task | Effort | Dependencies |
|------|------|--------|--------------|
| 1.4.1 | Create vendor_qa table with RLS policies | 3h | None |
| 1.4.2 | Add qa_deadline to evaluation_projects | 1h | None |
| 1.4.3 | Build VendorQAService | 6h | 1.4.1 |
| 1.4.4 | Build QASubmissionForm for vendor portal | 4h | 1.4.3 |
| 1.4.5 | Build QAHistory component for vendor portal | 4h | 1.4.3 |
| 1.4.6 | Add Q&A section to VendorPortal page | 3h | 1.4.4, 1.4.5 |
| 1.4.7 | Build QAManagementHub page | 6h | 1.4.3 |
| 1.4.8 | Build QAResponseForm component | 4h | 1.4.3 |
| 1.4.9 | Build ShareQAModal with anonymization | 4h | 1.4.3 |
| 1.4.10 | Add Q&A notifications (new question, answer received) | 4h | 1.4.3, Feature 1.1 |
| 1.4.11 | Add QA badge to evaluator sidebar | 2h | 1.4.3 |
| 1.4.12 | Testing end-to-end Q&A flow | 4h | All |

**Total Effort:** 45 hours (~1.5 weeks)

**Acceptance Criteria:**
- [ ] Vendors can submit questions via portal before Q&A deadline
- [ ] Evaluation team sees all questions in QA hub
- [ ] Team can respond to questions
- [ ] Responses visible to submitting vendor
- [ ] Option to share Q&A with all vendors (anonymized)
- [ ] Q&A deadline enforced (no new questions after)
- [ ] Notifications for new questions and answers

---

### Feature 1.5: Response Validation Rules

**Problem:** Vendors can submit incomplete or invalid responses

**Scope:**
- Required questions (must answer to submit)
- Minimum response length
- Maximum response length (word/character limit)
- Required document uploads per question
- Section completion requirements
- Validation errors shown clearly
- Cannot submit until all validation passes

**Technical Approach:**
```
Database:
- vendor_questions: add
    is_required, min_length, max_length,
    requires_attachment, validation_message

Frontend (Questions Hub):
- Validation settings per question in QuestionForm
- Bulk set validation rules

Frontend (Vendor Portal):
- Real-time validation indicators
- Validation error summary before submit
- Section completion progress
- Block submit until valid
```

**Implementation Steps:**

| Step | Task | Effort | Dependencies |
|------|------|--------|--------------|
| 1.5.1 | Add validation columns to vendor_questions | 2h | None |
| 1.5.2 | Update VendorQuestionsService with validation logic | 4h | 1.5.1 |
| 1.5.3 | Build ValidationRulesForm component | 4h | None |
| 1.5.4 | Add validation settings to QuestionForm | 3h | 1.5.3 |
| 1.5.5 | Build bulk validation rules modal | 4h | 1.5.3 |
| 1.5.6 | Build ResponseValidator component | 4h | 1.5.2 |
| 1.5.7 | Add real-time validation to VendorPortal | 6h | 1.5.6 |
| 1.5.8 | Build ValidationSummary component | 3h | 1.5.6 |
| 1.5.9 | Add submit blocking logic | 3h | 1.5.7 |
| 1.5.10 | Testing with various validation rules | 3h | All |

**Total Effort:** 36 hours (~1 week)

**Acceptance Criteria:**
- [ ] Questions can be marked as required
- [ ] Min/max length can be set per question
- [ ] Document upload can be required
- [ ] Vendor sees validation errors in real-time
- [ ] Vendor cannot submit until all validations pass
- [ ] Clear messaging about what's missing
- [ ] Validation summary before final submit

---

### Feature 1.6: Criteria Adjustment Controls

**Problem:** Hard to adjust evaluation criteria and weights after evaluation starts

**Scope:**
- Add/remove criteria mid-evaluation (with warning)
- Adjust category weights with automatic recalculation
- Adjust criteria weights within category
- Recalculate all affected scores
- Audit trail for all changes
- "What-if" preview before applying changes

**Technical Approach:**
```
Database:
- criteria_change_history (
    id, evaluation_project_id, change_type,
    entity_type, entity_id, old_value, new_value,
    changed_by, changed_at, reason
  )

Service:
- EvaluationCategoriesService.adjustWeight() - with recalculation
- EvaluationCriteriaService.addCriterion() - mid-evaluation
- EvaluationCriteriaService.removeCriterion() - with score handling
- ScoresService.recalculateVendorScores() - after criteria change

Frontend:
- CriteriaAdjustmentPanel in EvaluationSettings
- WeightSliders with live preview
- AddCriterionModal with impact warning
- RemoveCriterionModal with score handling options
- ChangeHistoryView for audit
```

**Implementation Steps:**

| Step | Task | Effort | Dependencies |
|------|------|--------|--------------|
| 1.6.1 | Create criteria_change_history table | 2h | None |
| 1.6.2 | Build weight adjustment with recalculation | 6h | 1.6.1 |
| 1.6.3 | Build add criterion mid-evaluation logic | 4h | 1.6.1 |
| 1.6.4 | Build remove criterion with score handling | 4h | 1.6.1 |
| 1.6.5 | Build CriteriaAdjustmentPanel component | 6h | None |
| 1.6.6 | Build WeightSliders with preview | 4h | 1.6.2 |
| 1.6.7 | Build AddCriterionModal with warnings | 4h | 1.6.3 |
| 1.6.8 | Build RemoveCriterionModal | 4h | 1.6.4 |
| 1.6.9 | Build ChangeHistoryView | 4h | 1.6.1 |
| 1.6.10 | Add recalculation trigger to vendor scores | 4h | 1.6.2 |
| 1.6.11 | Testing with various scenarios | 4h | All |

**Total Effort:** 46 hours (~1.5 weeks)

**Acceptance Criteria:**
- [ ] Admin can adjust category weights with live preview
- [ ] Admin can adjust criteria weights within category
- [ ] Admin can add new criteria mid-evaluation
- [ ] Admin can remove criteria (with score handling options)
- [ ] All changes trigger score recalculation
- [ ] Full audit trail of all changes
- [ ] Warning shown when changes affect existing scores

---

### Phase 1 Summary

| Feature | Effort | Status |
|---------|--------|--------|
| 1.1 Smart Notifications | 50h | Planned |
| 1.2 Scoring Lock | 33h | Planned |
| 1.3 Blind Scoring | 31h | Planned |
| 1.4 Vendor Q&A | 45h | Planned |
| 1.5 Response Validation | 36h | Planned |
| 1.6 Criteria Adjustment | 46h | Planned |
| **Total** | **241h** | **~6 weeks** |

**Phase 1 Deliverables:**
- Automated deadline management with reminders
- Scoring integrity with lock and blind modes
- Complete vendor interaction via Q&A
- Quality vendor responses via validation
- Flexible evaluation criteria management

---

## Phase 2: Efficiency & Templates

**Goal:** Reduce setup time and improve day-to-day usability
**Duration:** 4-6 weeks
**Priority:** P2 - High

### Feature 2.1: Evaluation Templates

**Problem:** Manual setup of each evaluation from scratch

**Scope:**
- Pre-built templates for common evaluation types:
  - CRM Evaluation
  - ERP Evaluation
  - HRIS Evaluation
  - Cloud Infrastructure
  - Cybersecurity Tools
  - Custom (blank)
- Template includes:
  - Categories with default weights
  - Criteria within each category
  - Suggested RFP questions
  - Stakeholder area suggestions
- Clone from previous evaluation
- Save current evaluation as template

**Technical Approach:**
```
Database:
- evaluation_templates (
    id, organisation_id, name, description,
    template_type, is_system, is_public,
    categories_json, criteria_json, questions_json,
    stakeholder_areas_json, created_by
  )

Frontend:
- TemplateSelector in CreateEvaluationModal
- TemplatePreview component
- SaveAsTemplateModal
- TemplateManagement page (admin)
```

**Implementation Steps:**

| Step | Task | Effort | Dependencies |
|------|------|--------|--------------|
| 2.1.1 | Create evaluation_templates table | 3h | None |
| 2.1.2 | Build EvaluationTemplateService | 6h | 2.1.1 |
| 2.1.3 | Create system templates (CRM, ERP, HRIS, etc.) | 12h | 2.1.2 |
| 2.1.4 | Build TemplateSelector component | 4h | 2.1.2 |
| 2.1.5 | Build TemplatePreview component | 4h | 2.1.2 |
| 2.1.6 | Integrate templates into CreateEvaluationModal | 4h | 2.1.4 |
| 2.1.7 | Build SaveAsTemplateModal | 4h | 2.1.2 |
| 2.1.8 | Build CloneEvaluationModal | 4h | 2.1.2 |
| 2.1.9 | Build TemplateManagement admin page | 6h | 2.1.2 |
| 2.1.10 | Testing template application | 4h | All |

**Total Effort:** 51 hours (~1.5 weeks)

**Acceptance Criteria:**
- [ ] 5+ system templates available out-of-box
- [ ] Templates include categories, criteria, questions
- [ ] User can preview template before applying
- [ ] User can clone from previous evaluation
- [ ] User can save evaluation as custom template
- [ ] Admin can manage organisation templates

---

### Feature 2.2: Question Templates & Library

**Problem:** Manual creation of RFP questions for each evaluation

**Scope:**
- Question library by category
- Import questions from templates
- Import questions from previous evaluations
- Tag and search questions
- Bulk add questions to evaluation
- Question versioning

**Technical Approach:**
```
Database:
- question_library (
    id, organisation_id, category_tag,
    question_text, guidance_text,
    default_validation, tags[],
    usage_count, created_by
  )

Frontend:
- QuestionLibrary page
- QuestionImportModal
- QuestionSearch component
- BulkAddQuestions component
```

**Implementation Steps:**

| Step | Task | Effort | Dependencies |
|------|------|--------|--------------|
| 2.2.1 | Create question_library table | 2h | None |
| 2.2.2 | Build QuestionLibraryService | 4h | 2.2.1 |
| 2.2.3 | Seed library with common questions | 8h | 2.2.2 |
| 2.2.4 | Build QuestionLibrary browse page | 6h | 2.2.2 |
| 2.2.5 | Build QuestionSearch with filters | 4h | 2.2.2 |
| 2.2.6 | Build QuestionImportModal | 4h | 2.2.2 |
| 2.2.7 | Build BulkAddQuestions component | 4h | 2.2.2 |
| 2.2.8 | Add "Save to Library" on questions | 2h | 2.2.2 |
| 2.2.9 | Testing import/export flows | 3h | All |

**Total Effort:** 37 hours (~1 week)

**Acceptance Criteria:**
- [ ] Library of 50+ common RFP questions
- [ ] Questions organized by category/tag
- [ ] Search and filter questions
- [ ] Bulk import into evaluation
- [ ] Save custom questions to library
- [ ] Track question usage across evaluations

---

### Feature 2.3: Requirements Excel Import

**Problem:** Many clients have existing requirements in spreadsheets

**Scope:**
- Upload Excel/CSV file
- Column mapping wizard
- Preview before import
- Duplicate detection
- Bulk categorization
- Import validation and error handling

**Technical Approach:**
```
Frontend:
- RequirementsImportModal
- ColumnMappingWizard
- ImportPreview component
- DuplicateReview component

Libraries:
- xlsx (Excel parsing)
- papaparse (CSV parsing)
```

**Implementation Steps:**

| Step | Task | Effort | Dependencies |
|------|------|--------|--------------|
| 2.3.1 | Build file upload and parsing logic | 4h | None |
| 2.3.2 | Build ColumnMappingWizard | 6h | 2.3.1 |
| 2.3.3 | Build ImportPreview with validation | 4h | 2.3.2 |
| 2.3.4 | Build duplicate detection logic | 4h | 2.3.2 |
| 2.3.5 | Build DuplicateReview component | 3h | 2.3.4 |
| 2.3.6 | Build bulk import API | 4h | 2.3.3 |
| 2.3.7 | Add import button to RequirementsHub | 2h | 2.3.6 |
| 2.3.8 | Testing with various Excel formats | 4h | All |

**Total Effort:** 31 hours (~1 week)

**Acceptance Criteria:**
- [ ] Support Excel (.xlsx) and CSV files
- [ ] Column mapping for all requirement fields
- [ ] Preview rows before import
- [ ] Detect and flag duplicates
- [ ] Validation errors shown per row
- [ ] Successful import creates requirements

---

### Feature 2.4: Bulk Operations

**Problem:** Many operations require one-by-one actions

**Scope:**
- Bulk approve/reject requirements
- Bulk import vendors from CSV
- Bulk assign requirements to category
- Bulk assign requirements to stakeholder area
- Bulk delete with confirmation
- Bulk status change

**Technical Approach:**
```
Frontend:
- BulkActionBar component (appears on selection)
- BulkApprovalModal
- BulkAssignModal
- BulkDeleteModal
- Selection state management in list views

Service:
- Add bulk methods to RequirementsService
- Add bulk methods to VendorsService
```

**Implementation Steps:**

| Step | Task | Effort | Dependencies |
|------|------|--------|--------------|
| 2.4.1 | Build BulkActionBar component | 4h | None |
| 2.4.2 | Add selection state to RequirementsHub | 3h | 2.4.1 |
| 2.4.3 | Build BulkApprovalModal | 3h | 2.4.2 |
| 2.4.4 | Build BulkAssignModal | 3h | 2.4.2 |
| 2.4.5 | Add bulk methods to RequirementsService | 4h | None |
| 2.4.6 | Build vendor CSV import | 4h | None |
| 2.4.7 | Add selection state to VendorsHub | 3h | 2.4.1 |
| 2.4.8 | Build BulkStatusChangeModal | 3h | 2.4.7 |
| 2.4.9 | Testing bulk operations | 3h | All |

**Total Effort:** 30 hours (~1 week)

**Acceptance Criteria:**
- [ ] Select multiple requirements with checkboxes
- [ ] Bulk approve selected requirements
- [ ] Bulk assign to category/stakeholder area
- [ ] Import vendors from CSV
- [ ] Bulk change vendor status
- [ ] Confirmation before destructive bulk actions

---

### Feature 2.5: Side-by-Side Scoring View

**Problem:** Must switch between vendors to compare responses

**Scope:**
- Compare 2-4 vendors side by side
- See responses to same question together
- See scores for same criterion together
- Highlight differences
- Quick score entry in comparison view

**Technical Approach:**
```
Frontend:
- VendorComparisonView page
- VendorColumnCard component
- ComparisonResponseRow component
- ComparisonScoreRow component
- Synchronized scrolling
```

**Implementation Steps:**

| Step | Task | Effort | Dependencies |
|------|------|--------|--------------|
| 2.5.1 | Build VendorComparisonView page layout | 6h | None |
| 2.5.2 | Build VendorColumnCard component | 4h | 2.5.1 |
| 2.5.3 | Build ComparisonResponseRow | 4h | 2.5.1 |
| 2.5.4 | Build ComparisonScoreRow with inline scoring | 6h | 2.5.1 |
| 2.5.5 | Add vendor selector (pick 2-4) | 3h | 2.5.1 |
| 2.5.6 | Add synchronized scrolling | 3h | 2.5.1 |
| 2.5.7 | Add difference highlighting | 3h | 2.5.3 |
| 2.5.8 | Add navigation from EvaluationHub | 2h | 2.5.1 |
| 2.5.9 | Testing comparison scenarios | 3h | All |

**Total Effort:** 34 hours (~1 week)

**Acceptance Criteria:**
- [ ] Select 2-4 vendors to compare
- [ ] See responses side by side per question
- [ ] See scores side by side per criterion
- [ ] Score directly in comparison view
- [ ] Differences visually highlighted
- [ ] Synchronized vertical scrolling

---

### Feature 2.6: Calendar Integration

**Problem:** Workshop scheduling is manual, no calendar sync

**Scope:**
- Google Calendar integration
- Microsoft Outlook integration
- Auto-create calendar events for workshops
- Send calendar invites to attendees
- Sync deadlines to calendar
- iCal export for other calendars

**Technical Approach:**
```
Backend:
- OAuth flow for Google/Microsoft
- Calendar event creation APIs
- Webhook for event updates

Frontend:
- CalendarConnect component in settings
- CalendarSync toggle per workshop
- iCal download button
```

**Implementation Steps:**

| Step | Task | Effort | Dependencies |
|------|------|--------|--------------|
| 2.6.1 | Set up Google Calendar OAuth | 4h | None |
| 2.6.2 | Set up Microsoft Graph OAuth | 4h | None |
| 2.6.3 | Build CalendarService with unified API | 6h | 2.6.1, 2.6.2 |
| 2.6.4 | Build CalendarConnect settings component | 4h | 2.6.3 |
| 2.6.5 | Add calendar sync to workshop creation | 4h | 2.6.3 |
| 2.6.6 | Build attendee invite via calendar | 4h | 2.6.3 |
| 2.6.7 | Add deadline sync to calendar | 3h | 2.6.3 |
| 2.6.8 | Build iCal export fallback | 3h | None |
| 2.6.9 | Testing with both providers | 4h | All |

**Total Effort:** 36 hours (~1 week)

**Acceptance Criteria:**
- [ ] Connect Google or Microsoft calendar
- [ ] Workshops auto-create calendar events
- [ ] Attendees receive calendar invites
- [ ] Deadlines sync to calendar
- [ ] iCal export for unsupported calendars
- [ ] Calendar disconnection option

---

### Phase 2 Summary

| Feature | Effort | Status |
|---------|--------|--------|
| 2.1 Evaluation Templates | 51h | Planned |
| 2.2 Question Templates | 37h | Planned |
| 2.3 Excel Import | 31h | Planned |
| 2.4 Bulk Operations | 30h | Planned |
| 2.5 Side-by-Side Scoring | 34h | Planned |
| 2.6 Calendar Integration | 36h | Planned |
| **Total** | **219h** | **~5.5 weeks** |

**Phase 2 Deliverables:**
- Fast evaluation setup with templates
- Reusable question library
- Easy requirements import from Excel
- Efficient bulk operations
- Better scoring UX with comparison view
- Seamless calendar integration

---

## Phase 3: Advanced AI & Collaboration

**Goal:** Differentiate with AI-powered features and real-time collaboration
**Duration:** 6-8 weeks
**Priority:** P2 - High

### Feature 3.1: Real-Time Workshop Capture

**Problem:** Single-user requirement entry during workshops

**Scope:**
- Live collaborative requirement capture
- Multiple users can add/edit simultaneously
- Real-time sync across all participants
- Facilitator controls (lock, highlight, prioritize)
- Live voting/prioritization
- Workshop mode with focused UI

**Technical Approach:**
```
Technology:
- Supabase Realtime for sync
- Presence indicators for active users
- Operational transforms for conflict resolution

Frontend:
- WorkshopLiveCapture page
- LiveRequirementCard (editable in place)
- PresenceIndicator component
- VotingPanel component
- FacilitatorControls component
```

**Implementation Steps:**

| Step | Task | Effort | Dependencies |
|------|------|--------|--------------|
| 3.1.1 | Design real-time data model | 4h | None |
| 3.1.2 | Set up Supabase Realtime channels | 6h | 3.1.1 |
| 3.1.3 | Build presence tracking | 4h | 3.1.2 |
| 3.1.4 | Build WorkshopLiveCapture page | 8h | 3.1.2 |
| 3.1.5 | Build LiveRequirementCard | 6h | 3.1.4 |
| 3.1.6 | Build conflict resolution logic | 6h | 3.1.5 |
| 3.1.7 | Build PresenceIndicator | 3h | 3.1.3 |
| 3.1.8 | Build FacilitatorControls | 4h | 3.1.4 |
| 3.1.9 | Build VotingPanel for prioritization | 6h | 3.1.2 |
| 3.1.10 | Build workshop mode toggle | 2h | 3.1.4 |
| 3.1.11 | Testing with multiple users | 6h | All |

**Total Effort:** 55 hours (~1.5 weeks)

**Acceptance Criteria:**
- [ ] Multiple users see each other's edits in real-time
- [ ] Presence indicators show who's active
- [ ] Facilitator can lock requirements
- [ ] Live voting on requirements
- [ ] No data loss on concurrent edits
- [ ] Works with 10+ simultaneous users

---

### Feature 3.2: AI Requirement Consolidation

**Problem:** Duplicate and similar requirements across sources

**Scope:**
- AI detects potential duplicates
- AI suggests similar requirements to merge
- AI identifies conflicting requirements
- Merge wizard with field-level choices
- Maintain source traceability after merge
- Bulk consolidation review

**Technical Approach:**
```
API:
- /api/evaluator/ai-consolidate-requirements
- Uses embeddings for similarity detection
- Returns clusters of similar requirements

Frontend:
- ConsolidationReview page
- SimilarityCluster component
- MergeWizard component
- ConflictResolution component
```

**Implementation Steps:**

| Step | Task | Effort | Dependencies |
|------|------|--------|--------------|
| 3.2.1 | Design similarity detection algorithm | 4h | None |
| 3.2.2 | Build AI consolidation API endpoint | 8h | 3.2.1 |
| 3.2.3 | Build ConsolidationReview page | 6h | 3.2.2 |
| 3.2.4 | Build SimilarityCluster component | 4h | 3.2.3 |
| 3.2.5 | Build MergeWizard component | 6h | 3.2.3 |
| 3.2.6 | Build source traceability preservation | 4h | 3.2.5 |
| 3.2.7 | Build ConflictResolution component | 4h | 3.2.3 |
| 3.2.8 | Add "Find Duplicates" to RequirementsHub | 2h | 3.2.2 |
| 3.2.9 | Testing with various requirement sets | 4h | All |

**Total Effort:** 42 hours (~1 week)

**Acceptance Criteria:**
- [ ] AI identifies similar/duplicate requirements
- [ ] Similarity score shown for each match
- [ ] User can merge selected requirements
- [ ] Source traceability preserved after merge
- [ ] Conflicts highlighted for manual resolution
- [ ] Bulk review of all suggestions

---

### Feature 3.3: Cross-Vendor AI Comparison

**Problem:** Manual comparison of vendor responses

**Scope:**
- AI compares responses across vendors for same question
- Identifies key differentiators
- Highlights unique strengths/weaknesses
- Generates comparison summary
- Suggests scoring based on comparison

**Technical Approach:**
```
API:
- /api/evaluator/ai-compare-vendors
- Input: question_id, vendor_ids[]
- Output: comparison matrix, differentiators, summary

Frontend:
- AIComparisonPanel component
- DifferentiatorHighlight component
- ComparisonSummary component
```

**Implementation Steps:**

| Step | Task | Effort | Dependencies |
|------|------|--------|--------------|
| 3.3.1 | Design comparison prompt structure | 3h | None |
| 3.3.2 | Build AI comparison API endpoint | 8h | 3.3.1 |
| 3.3.3 | Build AIComparisonPanel component | 6h | 3.3.2 |
| 3.3.4 | Build DifferentiatorHighlight | 4h | 3.3.3 |
| 3.3.5 | Build ComparisonSummary | 4h | 3.3.3 |
| 3.3.6 | Integrate into VendorComparisonView | 4h | 3.3.3, Feature 2.5 |
| 3.3.7 | Add comparison to reports | 4h | 3.3.2 |
| 3.3.8 | Testing with various response types | 4h | All |

**Total Effort:** 37 hours (~1 week)

**Acceptance Criteria:**
- [ ] Compare 2-5 vendors on any question
- [ ] AI identifies key differences
- [ ] Strengths/weaknesses highlighted per vendor
- [ ] Summary paragraph generated
- [ ] Can include in reports
- [ ] Scoring suggestions based on comparison

---

### Feature 3.4: AI Recommendation Draft

**Problem:** Manual writing of evaluation recommendations

**Scope:**
- AI generates recommendation based on scores
- Includes executive summary
- Highlights key decision factors
- Identifies risks per vendor
- Suggests next steps
- Editable before finalizing

**Technical Approach:**
```
API:
- /api/evaluator/ai-generate-recommendation
- Input: evaluation_project_id
- Output: structured recommendation document

Frontend:
- RecommendationGenerator component
- RecommendationEditor component
- RecommendationPreview component
```

**Implementation Steps:**

| Step | Task | Effort | Dependencies |
|------|------|--------|--------------|
| 3.4.1 | Design recommendation structure | 3h | None |
| 3.4.2 | Build AI recommendation API | 8h | 3.4.1 |
| 3.4.3 | Build RecommendationGenerator UI | 4h | 3.4.2 |
| 3.4.4 | Build RecommendationEditor | 6h | 3.4.3 |
| 3.4.5 | Build RecommendationPreview | 4h | 3.4.3 |
| 3.4.6 | Add to ReportsHub | 3h | 3.4.3 |
| 3.4.7 | Testing with various evaluation scenarios | 4h | All |

**Total Effort:** 32 hours (~1 week)

**Acceptance Criteria:**
- [ ] One-click recommendation generation
- [ ] Executive summary included
- [ ] Key decision factors highlighted
- [ ] Risks identified per vendor
- [ ] Fully editable before export
- [ ] Integrates with report generation

---

### Feature 3.5: Compliance Checking

**Problem:** Manual verification of response compliance

**Scope:**
- AI checks response against specific requirements
- Identifies fully compliant, partial, non-compliant
- Flags missing information
- Generates compliance matrix
- Suggests clarification questions

**Technical Approach:**
```
API:
- /api/evaluator/ai-compliance-check
- Input: vendor_id, requirement_ids[]
- Output: compliance matrix with assessments

Frontend:
- ComplianceCheckPanel component
- ComplianceMatrix component
- NonComplianceDetails component
```

**Implementation Steps:**

| Step | Task | Effort | Dependencies |
|------|------|--------|--------------|
| 3.5.1 | Design compliance assessment criteria | 3h | None |
| 3.5.2 | Build AI compliance API | 8h | 3.5.1 |
| 3.5.3 | Build ComplianceCheckPanel | 4h | 3.5.2 |
| 3.5.4 | Build ComplianceMatrix | 6h | 3.5.3 |
| 3.5.5 | Build NonComplianceDetails | 4h | 3.5.3 |
| 3.5.6 | Add clarification question suggestions | 4h | 3.5.2 |
| 3.5.7 | Integrate into VendorDetail | 3h | 3.5.3 |
| 3.5.8 | Add to reports | 3h | 3.5.4 |
| 3.5.9 | Testing compliance detection | 4h | All |

**Total Effort:** 39 hours (~1 week)

**Acceptance Criteria:**
- [ ] Check vendor against selected requirements
- [ ] Compliance status per requirement
- [ ] Evidence of compliance/non-compliance
- [ ] Missing information flagged
- [ ] Clarification questions suggested
- [ ] Compliance matrix in reports

---

### Phase 3 Summary

| Feature | Effort | Status |
|---------|--------|--------|
| 3.1 Real-Time Workshop | 55h | Planned |
| 3.2 AI Consolidation | 42h | Planned |
| 3.3 Cross-Vendor Comparison | 37h | Planned |
| 3.4 AI Recommendation | 32h | Planned |
| 3.5 Compliance Checking | 39h | Planned |
| **Total** | **205h** | **~5 weeks** |

**Phase 3 Deliverables:**
- Real-time collaborative workshops
- AI-powered duplicate detection
- Automated vendor comparison
- AI-generated recommendations
- Compliance verification

---

## Phase 4: Enterprise Features

**Goal:** Support large-scale, complex procurement exercises
**Duration:** 8-10 weeks
**Priority:** P3 - Medium

### Feature 4.1: Procurement Workflow Stages

**Problem:** Limited workflow beyond basic evaluation phases

**Scope:**
- Configurable workflow stages
- Stage gates with approval requirements
- Automatic progression rules
- Stage-specific permissions
- Workflow templates by procurement type
- Stage history and audit trail

**Implementation Steps:**

| Step | Task | Effort | Dependencies |
|------|------|--------|--------------|
| 4.1.1 | Design workflow data model | 6h | None |
| 4.1.2 | Build workflow configuration UI | 12h | 4.1.1 |
| 4.1.3 | Build stage gate logic | 8h | 4.1.1 |
| 4.1.4 | Build workflow progression engine | 10h | 4.1.3 |
| 4.1.5 | Build stage-specific permissions | 8h | 4.1.1 |
| 4.1.6 | Build workflow templates | 6h | 4.1.2 |
| 4.1.7 | Build workflow audit trail | 4h | 4.1.4 |
| 4.1.8 | Testing complex workflows | 6h | All |

**Total Effort:** 60 hours (~1.5 weeks)

---

### Feature 4.2: Multi-Evaluation Benchmarking

**Problem:** Cannot compare across evaluations

**Scope:**
- Cross-evaluation vendor comparison
- Industry benchmarks
- Historical trend analysis
- Best practice identification
- Benchmark reports

**Implementation Steps:**

| Step | Task | Effort | Dependencies |
|------|------|--------|--------------|
| 4.2.1 | Design benchmarking data model | 4h | None |
| 4.2.2 | Build cross-evaluation query service | 8h | 4.2.1 |
| 4.2.3 | Build BenchmarkDashboard page | 10h | 4.2.2 |
| 4.2.4 | Build trend visualization | 8h | 4.2.3 |
| 4.2.5 | Build benchmark reports | 8h | 4.2.2 |
| 4.2.6 | Testing with historical data | 4h | All |

**Total Effort:** 42 hours (~1 week)

---

### Feature 4.3: Vendor Intelligence Integration

**Problem:** Limited external vendor data

**Scope:**
- LinkedIn company data
- Crunchbase integration
- G2/Gartner ratings
- News monitoring
- Financial data (D&B)
- Auto-update vendor profiles

**Implementation Steps:**

| Step | Task | Effort | Dependencies |
|------|------|--------|--------------|
| 4.3.1 | Research and select data providers | 4h | None |
| 4.3.2 | Build integration adapters | 16h | 4.3.1 |
| 4.3.3 | Build VendorIntelligencePanel | 8h | 4.3.2 |
| 4.3.4 | Build auto-update scheduler | 6h | 4.3.2 |
| 4.3.5 | Build intelligence reports | 6h | 4.3.2 |
| 4.3.6 | Testing integrations | 6h | All |

**Total Effort:** 46 hours (~1 week)

---

### Feature 4.4: Advanced Access Control

**Problem:** Limited role granularity

**Scope:**
- Custom role builder
- Field-level permissions
- Delegation capabilities
- Time-limited access
- IP restrictions
- SSO integration

**Implementation Steps:**

| Step | Task | Effort | Dependencies |
|------|------|--------|--------------|
| 4.4.1 | Design fine-grained permission model | 6h | None |
| 4.4.2 | Build custom role builder | 10h | 4.4.1 |
| 4.4.3 | Build field-level permissions | 8h | 4.4.1 |
| 4.4.4 | Build delegation system | 6h | 4.4.1 |
| 4.4.5 | Build time-limited access | 4h | 4.4.1 |
| 4.4.6 | Build SSO integration (SAML/OIDC) | 12h | None |
| 4.4.7 | Testing permission scenarios | 6h | All |

**Total Effort:** 52 hours (~1.5 weeks)

---

### Feature 4.5: Mobile Scoring App (PWA)

**Problem:** No mobile access for scoring

**Scope:**
- Progressive Web App
- Offline scoring capability
- Touch-optimized UI
- Push notifications
- Camera for evidence capture
- Sync when online

**Implementation Steps:**

| Step | Task | Effort | Dependencies |
|------|------|--------|--------------|
| 4.5.1 | PWA configuration and setup | 6h | None |
| 4.5.2 | Build mobile-optimized scoring UI | 16h | 4.5.1 |
| 4.5.3 | Build offline data sync | 12h | 4.5.2 |
| 4.5.4 | Build push notification support | 6h | 4.5.1 |
| 4.5.5 | Build camera evidence capture | 6h | 4.5.2 |
| 4.5.6 | Testing on various devices | 8h | All |

**Total Effort:** 54 hours (~1.5 weeks)

---

### Phase 4 Summary

| Feature | Effort | Status |
|---------|--------|--------|
| 4.1 Procurement Workflow | 60h | Planned |
| 4.2 Benchmarking | 42h | Planned |
| 4.3 Vendor Intelligence | 46h | Planned |
| 4.4 Access Control | 52h | Planned |
| 4.5 Mobile App | 54h | Planned |
| **Total** | **254h** | **~6.5 weeks** |

**Phase 4 Deliverables:**
- Configurable procurement workflows
- Cross-evaluation benchmarking
- External vendor intelligence
- Enterprise access control
- Mobile scoring capability

---

## Implementation Timeline

```
2026 Timeline (assuming 1 developer):

Jan     Feb     Mar     Apr     May     Jun     Jul     Aug
|-------|-------|-------|-------|-------|-------|-------|
[===== PHASE 1 =====]
        [===== PHASE 2 =====]
                        [====== PHASE 3 ======]
                                        [======= PHASE 4 =======]

Phase 1: Jan 13 - Feb 21 (6 weeks) - Customer Ready MVP
Phase 2: Feb 24 - Apr 4 (5.5 weeks) - Efficiency & Templates
Phase 3: Apr 7 - May 9 (5 weeks) - Advanced AI
Phase 4: May 12 - Jun 27 (6.5 weeks) - Enterprise Features

Total: ~23 weeks (with some buffer)
```

---

## Success Metrics

### Phase 1 Success Criteria
- [ ] Run a complete procurement exercise end-to-end
- [ ] 3+ evaluators scoring simultaneously
- [ ] 5+ vendors responding via portal
- [ ] Zero scoring integrity issues
- [ ] Client approval workflow functional

### Phase 2 Success Criteria
- [ ] New evaluation setup < 30 minutes (vs hours)
- [ ] 80% questions from library
- [ ] Bulk operations save 50%+ time
- [ ] Calendar integration used by 80% users

### Phase 3 Success Criteria
- [ ] Real-time workshop with 10+ users
- [ ] AI finds 80%+ duplicates
- [ ] AI comparison saves 2+ hours per evaluation
- [ ] 90%+ accuracy on compliance checking

### Phase 4 Success Criteria
- [ ] Support 50+ criteria evaluations
- [ ] 3+ integrations providing vendor data
- [ ] Mobile scoring used in field demos
- [ ] SSO for enterprise clients

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Real-time sync complexity | High | Start with simpler optimistic locking |
| AI accuracy concerns | Medium | Human review required for all AI outputs |
| Calendar OAuth complexity | Medium | Provide iCal fallback |
| External API rate limits | Medium | Caching and queue management |
| Mobile offline sync conflicts | High | Clear conflict resolution UI |

---

## Dependencies

### External Services
- **Vercel Cron** - For scheduled notifications (Phase 1)
- **Supabase Realtime** - For live collaboration (Phase 3)
- **Google/Microsoft OAuth** - For calendar (Phase 2)
- **LinkedIn/Crunchbase APIs** - For vendor intelligence (Phase 4)

### Internal Dependencies
- Phase 2 features assume Phase 1 complete
- Phase 3 AI features build on existing AI service
- Phase 4 mobile assumes responsive base components

---

*Implementation plan prepared January 9, 2026. Estimates assume single developer. Parallel development would reduce timeline.*
