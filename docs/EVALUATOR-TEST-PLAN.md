# Evaluator Tool - Comprehensive Test Plan

**Created:** January 4, 2026  
**Purpose:** End-to-end testing of the Evaluator tool across all phases  
**Estimated Testing Effort:** 8-12 chat sessions  
**Target:** Validate all functionality from project setup through vendor selection

---

## How to Use This Test Plan

### Working Across Multiple Chats

This test plan is designed to be executed across multiple Claude chat sessions. Each **Testing Block** represents a logical stopping point where you can:

1. Complete the tests in that block
2. Update the status in this document
3. Start a new chat if context is getting long
4. Resume from where you left off

### Context Check Protocol

At the **end of each Testing Block**, Claude will prompt:

> **Context Check:** We've completed [BLOCK NAME]. This is a good stopping point.
> - Current context usage is approximately [X]%
> - Recommend: [Continue / Start New Chat]
> 
> If starting a new chat, copy the "Resume Prompt" below.

### Test Result Recording

For each test case, update the status:
- ✅ **PASS** - Works as expected
- ❌ **FAIL** - Does not work (add notes)
- ⏭️ **SKIP** - Not applicable or blocked
- 🔲 **TODO** - Not yet tested

### Failure Handling

When a test fails:
1. Record the failure with details
2. Continue testing remaining items in the block
3. At the end of the block, decide whether to investigate or proceed
4. If investigating, note the investigation in a separate section

---

## AI Prompt to Start Testing

Copy this prompt to start a new testing session:

```
I'm testing the Evaluator tool for the AMSF001 Project Tracker application.

Please read these context files:
1. ~/Projects/amsf001-project-tracker/docs/EVALUATOR-TEST-PLAN.md (this test plan)
2. ~/Projects/amsf001-project-tracker/docs/EVALUATOR-IMPLEMENTATION-PLAN.md
3. ~/Projects/amsf001-project-tracker/docs/APPLICATION-CONTEXT.md

Current testing status: [BLOCK ID] - [BLOCK NAME]
Last completed test: [TEST ID]
Any outstanding issues: [NONE / describe issues]

Please help me continue testing. Start by confirming you understand the current 
position, then guide me through the next tests.
```

---

## Pre-Testing Setup

### Environment Verification

**Testing Environment:** Production (https://amsf001-project-tracker.vercel.app)

| Check | Command/Action | Expected | Status |
|-------|----------------|----------|--------|
| Production site accessible | Navigate to production URL | Site loads without errors | ✅ |
| Supabase connected | Check console for errors | No auth/db errors | ✅ |
| MCP tools available | Ask Claude to list tools | GitHub, Supabase, Vercel visible | ✅ |
| Test user available | Login as admin | Can access Evaluator | ✅ |

### Test Data Requirements

Before testing, ensure you have:

- [ ] At least one Organisation in the system
- [ ] A user with Admin role
- [ ] Access to create evaluation projects
- [ ] Sample documents (PDF, DOCX) for upload testing
- [ ] Sample vendor information for entry

---

## Testing Block 1: Project Setup & Navigation

**Estimated Time:** 15-20 minutes  
**Prerequisites:** Environment verified, logged in as Admin

### 1.1 Evaluation Project Creation

| ID | Test Case | Steps | Expected Result | Status | Notes |
|----|-----------|-------|-----------------|--------|-------|
| 1.1.1 | Navigate to Evaluator | Click "Evaluator" in main nav | Evaluator Dashboard loads | ✅ | Shows empty state with "Create Evaluation Project" button |
| 1.1.2 | Create new project | Click "Create Evaluation Project", fill form | Project created, dashboard shows | ✅ | Fixed: Created API endpoint + modal. Project "CO PS Form evaluation" created |
| 1.1.3 | Project appears in list | Check project switcher | New project visible in dropdown | ✅ | Project displays in dashboard header |
| 1.1.4 | Edit project details | Click settings, modify name | Changes saved | ✅ | ProjectDetailsManager added - shows name, client, description, dates, status |
| 1.1.5 | Delete project (soft) | Click delete in settings | Project hidden, can be restored | ⏭️ | Skip - Delete not implemented yet, low priority |

### 1.2 Navigation & Context

| ID | Test Case | Steps | Expected Result | Status | Notes |
|----|-----------|-------|-----------------|--------|-------|
| 1.2.1 | Switch evaluations | Use evaluation switcher | Context updates, data changes | 🔲 | |
| 1.2.2 | Dashboard shows correct data | Load dashboard | Stats reflect selected evaluation | 🔲 | |
| 1.2.3 | All nav links work | Click each menu item | Each page loads without error | 🔲 | |
| 1.2.4 | Breadcrumbs accurate | Navigate deep, check breadcrumbs | Correct hierarchy shown | 🔲 | |
| 1.2.5 | Back button works | Navigate, then back | Returns to previous page | 🔲 | |

### 1.3 Settings & Configuration

| ID | Test Case | Steps | Expected Result | Status | Notes |
|----|-----------|-------|-----------------|--------|-------|
| 1.3.1 | Create stakeholder area | Settings → Areas → Add | Area created with name | ✅ | Created 4 areas: IT, Finance, Security, Operations |
| 1.3.2 | Edit stakeholder area | Click edit on area | Changes saved | 🔲 | |
| 1.3.3 | Delete stakeholder area | Click delete on area | Area removed (if unused) | 🔲 | |
| 1.3.4 | Create evaluation category | Settings → Categories → Add | Category created with weight | ✅ | Created 4 categories at 25% each |
| 1.3.5 | Weight validation | Enter weights totaling =100% | Shows validation success | ✅ | Total Weight shows 100% with green checkmark |
| 1.3.6 | Configure scoring scale | Settings → Scoring | Scale labels editable | 🔲 | Scale displays correctly, need to test edit |

### Block 1 Summary

```
Tests: 16
Passed: ___
Failed: ___
Skipped: ___
Outstanding Issues: ___
```

**Context Check Point** - Recommend continuing or new chat based on context usage.

---

## Testing Block 2: Requirements Module

**Estimated Time:** 25-30 minutes  
**Prerequisites:** Block 1 complete, at least one category and stakeholder area created

### 2.1 Requirements CRUD

| ID | Test Case | Steps | Expected Result | Status | Notes |
|----|-----------|-------|-----------------|--------|-------|
| 2.1.1 | View requirements list | Navigate to Requirements | Empty state or list shown | 🔲 | |
| 2.1.2 | Create requirement | Click Add, fill form | Requirement created with REQ-### code | 🔲 | |
| 2.1.3 | Auto-increment code | Create second requirement | Code increments (REQ-002) | 🔲 | |
| 2.1.4 | All fields save | Fill all fields, save | All values persisted | 🔲 | |
| 2.1.5 | Edit requirement | Click edit, modify | Changes saved | 🔲 | |
| 2.1.6 | Delete requirement | Click delete, confirm | Soft deleted, hidden from list | 🔲 | |

### 2.2 Requirements Filtering & Views

| ID | Test Case | Steps | Expected Result | Status | Notes |
|----|-----------|-------|-----------------|--------|-------|
| 2.2.1 | Filter by category | Select category filter | Only matching requirements shown | 🔲 | |
| 2.2.2 | Filter by priority | Select Must Have | Only must-have shown | 🔲 | |
| 2.2.3 | Filter by status | Select Approved | Only approved shown | 🔲 | |
| 2.2.4 | Filter by stakeholder area | Select area | Only matching shown | 🔲 | |
| 2.2.5 | Multiple filters | Apply 2+ filters | Combines correctly | 🔲 | |
| 2.2.6 | Clear filters | Click clear all | All requirements visible | 🔲 | |
| 2.2.7 | Search by text | Type in search box | Matches title/description | 🔲 | |
| 2.2.8 | Matrix view | Switch to matrix | Grouped display works | 🔲 | |

### 2.3 Requirements Workflow

| ID | Test Case | Steps | Expected Result | Status | Notes |
|----|-----------|-------|-----------------|--------|-------|
| 2.3.1 | Submit for review | Change status draft→review | Status updates | 🔲 | |
| 2.3.2 | Approve requirement | Change status review→approved | Validated timestamp set | 🔲 | |
| 2.3.3 | Reject requirement | Change status review→rejected | Status updates with reason | 🔲 | |
| 2.3.4 | Cannot edit approved | Try to edit approved req | Editing restricted or warned | 🔲 | |

### Block 2 Summary

```
Tests: 18
Passed: ___
Failed: ___
Skipped: ___
Outstanding Issues: ___
```

**Context Check Point**

---

## Testing Block 3: Input Capture (Workshops & Surveys)

**Estimated Time:** 30-40 minutes  
**Prerequisites:** Block 2 complete, requirements module working

### 3.1 Workshop Management

| ID | Test Case | Steps | Expected Result | Status | Notes |
|----|-----------|-------|-----------------|--------|-------|
| 3.1.1 | View workshops list | Navigate to Workshops | List or empty state shown | 🔲 | |
| 3.1.2 | Create workshop | Click Add, fill details | Workshop created with date | 🔲 | |
| 3.1.3 | Add attendees | Open workshop, add attendees | Attendees listed | 🔲 | |
| 3.1.4 | Mark attendance | Check attendance boxes | Attendance saved | 🔲 | |
| 3.1.5 | Edit workshop | Modify workshop details | Changes saved | 🔲 | |
| 3.1.6 | Delete workshop | Delete unused workshop | Workshop removed | 🔲 | |

### 3.2 Live Capture Mode

| ID | Test Case | Steps | Expected Result | Status | Notes |
|----|-----------|-------|-----------------|--------|-------|
| 3.2.1 | Enter capture mode | Click "Start Capture" on workshop | Capture interface opens | 🔲 | |
| 3.2.2 | Quick-add requirement | Enter requirement in capture | Requirement created | 🔲 | |
| 3.2.3 | Source attribution | Check created requirement | source_workshop_id set | 🔲 | |
| 3.2.4 | Assign to attendee | Select attendee when capturing | raised_by set correctly | 🔲 | |
| 3.2.5 | Multiple rapid entries | Add 5 requirements quickly | All saved correctly | 🔲 | |
| 3.2.6 | End capture mode | Click "End Session" | Returns to workshop detail | 🔲 | |

### 3.3 Surveys & Follow-up

| ID | Test Case | Steps | Expected Result | Status | Notes |
|----|-----------|-------|-----------------|--------|-------|
| 3.3.1 | Create survey | Click Add Survey | Survey created | 🔲 | |
| 3.3.2 | Add text question | Add question, type text | Question saved | 🔲 | |
| 3.3.3 | Add choice question | Add multiple choice | Options saved | 🔲 | |
| 3.3.4 | Add rating question | Add 1-5 rating | Scale saved | 🔲 | |
| 3.3.5 | Link to workshop | Associate survey with workshop | Relationship created | 🔲 | |
| 3.3.6 | Submit response | Fill survey as participant | Response saved | 🔲 | |
| 3.3.7 | View responses | Check survey responses | Answers visible | 🔲 | |
| 3.3.8 | Create req from response | Convert answer to requirement | Requirement created with source | 🔲 | |

### 3.4 Document Upload

| ID | Test Case | Steps | Expected Result | Status | Notes |
|----|-----------|-------|-----------------|--------|-------|
| 3.4.1 | Navigate to Documents | Click Documents in nav | Documents Hub loads | 🔲 | |
| 3.4.2 | Upload PDF | Upload test PDF | File uploaded to storage | 🔲 | |
| 3.4.3 | Upload DOCX | Upload test DOCX | File uploaded | 🔲 | |
| 3.4.4 | View document list | Check list | Uploaded files shown | 🔲 | |
| 3.4.5 | Preview document | Click preview | Document viewer opens | 🔲 | |
| 3.4.6 | Delete document | Delete uploaded file | File removed from storage | 🔲 | |

### Block 3 Summary

```
Tests: 26
Passed: ___
Failed: ___
Skipped: ___
Outstanding Issues: ___
```

**Context Check Point** - This is a good stopping point if context is high.

---

## Testing Block 4: Vendor Management

**Estimated Time:** 25-30 minutes  
**Prerequisites:** Block 3 complete, at least 3 requirements exist

### 4.1 Vendor CRUD

| ID | Test Case | Steps | Expected Result | Status | Notes |
|----|-----------|-------|-----------------|--------|-------|
| 4.1.1 | View vendors list | Navigate to Vendors | Vendors Hub loads | 🔲 | |
| 4.1.2 | Create vendor | Click Add, fill details | Vendor created | 🔲 | |
| 4.1.3 | Required fields validation | Submit without name | Validation error shown | 🔲 | |
| 4.1.4 | Edit vendor | Modify vendor details | Changes saved | 🔲 | |
| 4.1.5 | Add vendor contact | Add primary contact | Contact saved with vendor | 🔲 | |
| 4.1.6 | Add multiple contacts | Add 2nd contact | Both contacts listed | 🔲 | |
| 4.1.7 | Delete vendor | Delete unused vendor | Vendor removed | 🔲 | |

### 4.2 Vendor Pipeline

| ID | Test Case | Steps | Expected Result | Status | Notes |
|----|-----------|-------|-----------------|--------|-------|
| 4.2.1 | View pipeline | Switch to pipeline view | Kanban board displayed | 🔲 | |
| 4.2.2 | Vendors in correct lanes | Check vendor positions | Status matches lane | 🔲 | |
| 4.2.3 | Drag vendor to new status | Drag card to new lane | Status updates | 🔲 | |
| 4.2.4 | Status history logged | Check vendor history | Transition recorded | 🔲 | |
| 4.2.5 | Filter pipeline | Apply filter | Only matching vendors shown | 🔲 | |

### 4.3 Vendor Questions

| ID | Test Case | Steps | Expected Result | Status | Notes |
|----|-----------|-------|-----------------|--------|-------|
| 4.3.1 | Create question | Add question to evaluation | Question saved | 🔲 | |
| 4.3.2 | Link question to requirement | Associate question | Relationship created | 🔲 | |
| 4.3.3 | Question types work | Create each type | All types save correctly | 🔲 | |
| 4.3.4 | Edit question | Modify question text | Changes saved | 🔲 | |
| 4.3.5 | Delete question | Remove question | Question deleted | 🔲 | |

### 4.4 Vendor Portal Access

| ID | Test Case | Steps | Expected Result | Status | Notes |
|----|-----------|-------|-----------------|--------|-------|
| 4.4.1 | Generate access code | Click "Generate Portal Code" | Code created | 🔲 | |
| 4.4.2 | Code is unique | Generate for 2 vendors | Different codes | 🔲 | |
| 4.4.3 | Portal auth works | Use code to access portal | Portal loads for vendor | 🔲 | |
| 4.4.4 | Wrong code rejected | Enter invalid code | Access denied | 🔲 | |
| 4.4.5 | Vendor sees own data only | Check portal as vendor | Only own vendor data visible | 🔲 | |

### Block 4 Summary

```
Tests: 22
Passed: ___
Failed: ___
Skipped: ___
Outstanding Issues: ___
```

**Context Check Point**

---

## Testing Block 5: Evaluation & Scoring

**Estimated Time:** 35-45 minutes  
**Prerequisites:** Block 4 complete, at least 3 vendors and 5 requirements exist

### 5.1 Evidence Management

| ID | Test Case | Steps | Expected Result | Status | Notes |
|----|-----------|-------|-----------------|--------|-------|
| 5.1.1 | Add demo notes evidence | Create evidence, type demo_notes | Evidence saved | 🔲 | |
| 5.1.2 | Add reference check | Create evidence, type reference_check | Evidence saved | 🔲 | |
| 5.1.3 | Link evidence to vendor | Associate evidence | Evidence shown on vendor | 🔲 | |
| 5.1.4 | Link evidence to requirement | Associate requirement | Link created | 🔲 | |
| 5.1.5 | Link evidence to criterion | Associate criterion | Link created | 🔲 | |
| 5.1.6 | Edit evidence | Modify evidence content | Changes saved | 🔲 | |
| 5.1.7 | Delete evidence | Remove evidence | Evidence deleted | 🔲 | |

### 5.2 Scoring Interface

| ID | Test Case | Steps | Expected Result | Status | Notes |
|----|-----------|-------|-----------------|--------|-------|
| 5.2.1 | Navigate to Evaluation Hub | Click Evaluation in nav | Hub loads | 🔲 | |
| 5.2.2 | Select vendor to score | Choose vendor | Scoring interface loads | 🔲 | |
| 5.2.3 | View criteria list | Check interface | All criteria visible | 🔲 | |
| 5.2.4 | Enter score | Select score 1-5 | Score recorded | 🔲 | |
| 5.2.5 | Score requires rationale | Try to save without rationale | Validation error | 🔲 | |
| 5.2.6 | Add rationale | Enter rationale text | Score saves | 🔲 | |
| 5.2.7 | Link evidence to score | Associate evidence | Link created | 🔲 | |
| 5.2.8 | View vendor response | Check context panel | Response displayed | 🔲 | |
| 5.2.9 | View linked requirements | Check context panel | Requirements shown | 🔲 | |
| 5.2.10 | Edit existing score | Modify previous score | Score updated | 🔲 | |

### 5.3 Multi-Evaluator Scoring

| ID | Test Case | Steps | Expected Result | Status | Notes |
|----|-----------|-------|-----------------|--------|-------|
| 5.3.1 | Second evaluator scores | Login as different user, score | Both scores saved | 🔲 | |
| 5.3.2 | Scores are independent | Check each evaluator | Own scores visible | 🔲 | |
| 5.3.3 | Admin sees all scores | Login as admin | All evaluator scores visible | 🔲 | |

### 5.4 Reconciliation

| ID | Test Case | Steps | Expected Result | Status | Notes |
|----|-----------|-------|-----------------|--------|-------|
| 5.4.1 | View reconciliation panel | Open reconciliation | Panel loads | 🔲 | |
| 5.4.2 | Scores side-by-side | Check display | Evaluator scores compared | 🔲 | |
| 5.4.3 | Variance highlighted | Scores differ by >1 | Visual indicator shown | 🔲 | |
| 5.4.4 | Enter consensus score | Set consensus value | Consensus saved | 🔲 | |
| 5.4.5 | Consensus rationale | Enter consensus notes | Notes saved | 🔲 | |

### 5.5 Weighted Calculations

| ID | Test Case | Steps | Expected Result | Status | Notes |
|----|-----------|-------|-----------------|--------|-------|
| 5.5.1 | Category totals calculate | Score multiple criteria | Category score shows | 🔲 | |
| 5.5.2 | Weights applied correctly | Check weighted scores | Math is correct | 🔲 | |
| 5.5.3 | Overall vendor score | Check total | Correct weighted average | 🔲 | |
| 5.5.4 | Ranking updates | Score second vendor | Ranking order correct | 🔲 | |

### Block 5 Summary

```
Tests: 26
Passed: ___
Failed: ___
Skipped: ___
Outstanding Issues: ___
```

**Context Check Point** - Strongly recommend new chat if context is over 70%

---

## Testing Block 6: Vendor Portal (Full)

**Estimated Time:** 20-25 minutes  
**Prerequisites:** Block 5 complete, vendor with portal access code exists

### 6.1 Portal Authentication

| ID | Test Case | Steps | Expected Result | Status | Notes |
|----|-----------|-------|-----------------|--------|-------|
| 6.1.1 | Load portal page | Navigate to /vendor-portal | Login form displays | 🔲 | |
| 6.1.2 | Valid code login | Enter valid access code | Portal dashboard loads | 🔲 | |
| 6.1.3 | Invalid code rejected | Enter wrong code | Error message shown | 🔲 | |
| 6.1.4 | Expired code rejected | Use expired code | Access denied | 🔲 | |
| 6.1.5 | Session persists | Refresh page | Still logged in | 🔲 | |
| 6.1.6 | Logout works | Click logout | Returns to login | 🔲 | |

### 6.2 Vendor Response Submission

| ID | Test Case | Steps | Expected Result | Status | Notes |
|----|-----------|-------|-----------------|--------|-------|
| 6.2.1 | View assigned questions | Check questions tab | Questions displayed | 🔲 | |
| 6.2.2 | Answer text question | Enter response | Response saves | 🔲 | |
| 6.2.3 | Answer choice question | Select option | Response saves | 🔲 | |
| 6.2.4 | Save partial progress | Answer some, leave | Progress preserved | 🔲 | |
| 6.2.5 | Submit all responses | Complete and submit | Status updates to submitted | 🔲 | |
| 6.2.6 | Cannot edit after submit | Try to modify | Editing disabled | 🔲 | |

### 6.3 Vendor Document Upload

| ID | Test Case | Steps | Expected Result | Status | Notes |
|----|-----------|-------|-----------------|--------|-------|
| 6.3.1 | Upload capability visible | Check documents tab | Upload button present | 🔲 | |
| 6.3.2 | Upload document | Upload PDF | File saved | 🔲 | |
| 6.3.3 | Categorize document | Select category | Category saved | 🔲 | |
| 6.3.4 | View uploaded files | Check file list | Uploaded files shown | 🔲 | |
| 6.3.5 | Delete own document | Remove file | File deleted | 🔲 | |

### 6.4 Vendor Portal Progress

| ID | Test Case | Steps | Expected Result | Status | Notes |
|----|-----------|-------|-----------------|--------|-------|
| 6.4.1 | Progress indicator | Check dashboard | Completion % shown | 🔲 | |
| 6.4.2 | Progress updates | Answer more questions | Percentage increases | 🔲 | |
| 6.4.3 | Deadline visible | Check dashboard | Due date shown | 🔲 | |

### Block 6 Summary

```
Tests: 18
Passed: ___
Failed: ___
Skipped: ___
Outstanding Issues: ___
```

**Context Check Point**

---

## Testing Block 7: Traceability & Reports

**Estimated Time:** 30-35 minutes  
**Prerequisites:** Block 6 complete, multiple vendors scored

### 7.1 Traceability Matrix

| ID | Test Case | Steps | Expected Result | Status | Notes |
|----|-----------|-------|-----------------|--------|-------|
| 7.1.1 | Navigate to Traceability | Click Traceability in nav | Matrix view loads | 🔲 | |
| 7.1.2 | Requirements as rows | Check structure | Requirements listed vertically | 🔲 | |
| 7.1.3 | Vendors as columns | Check structure | Vendors listed horizontally | 🔲 | |
| 7.1.4 | Scores in cells | Check intersections | Scores displayed | 🔲 | |
| 7.1.5 | RAG styling applied | Check visual | Red/Amber/Green based on score | 🔲 | |
| 7.1.6 | Group by category | Toggle grouping | Grouped view works | 🔲 | |

### 7.2 Drilldown Functionality

| ID | Test Case | Steps | Expected Result | Status | Notes |
|----|-----------|-------|-----------------|--------|-------|
| 7.2.1 | Click cell for drilldown | Click score cell | Modal opens | 🔲 | |
| 7.2.2 | Requirement shown | Check modal | Requirement details visible | 🔲 | |
| 7.2.3 | Score shown | Check modal | Score and rationale visible | 🔲 | |
| 7.2.4 | Evidence linked | Check modal | Linked evidence displayed | 🔲 | |
| 7.2.5 | Full chain visible | Trace path | Req → Criterion → Evidence → Score | 🔲 | |
| 7.2.6 | Close drilldown | Click close/outside | Modal closes | 🔲 | |

### 7.3 Client Portal

| ID | Test Case | Steps | Expected Result | Status | Notes |
|----|-----------|-------|-----------------|--------|-------|
| 7.3.1 | Generate client access | Create client portal link | Access code generated | 🔲 | |
| 7.3.2 | Client portal login | Use access code | Client dashboard loads | 🔲 | |
| 7.3.3 | Branding applied | Check styling | Client branding visible | 🔲 | |
| 7.3.4 | Progress summary shown | Check dashboard | Evaluation progress displayed | 🔲 | |
| 7.3.5 | Requirements visible | Check requirements | Client can see requirements | 🔲 | |
| 7.3.6 | Can comment on reqs | Add comment | Comment saved | 🔲 | |
| 7.3.7 | Vendor comparison | Check comparison (if enabled) | Vendors compared | 🔲 | |

### 7.4 Report Generation

| ID | Test Case | Steps | Expected Result | Status | Notes |
|----|-----------|-------|-----------------|--------|-------|
| 7.4.1 | Navigate to Reports | Click Reports in nav | Reports Hub loads | 🔲 | |
| 7.4.2 | Generate PDF report | Click generate | PDF creates/downloads | 🔲 | |
| 7.4.3 | Report contains summary | Check PDF | Executive summary present | 🔲 | |
| 7.4.4 | Report contains scores | Check PDF | Vendor scores included | 🔲 | |
| 7.4.5 | Report contains matrix | Check PDF | Traceability matrix included | 🔲 | |
| 7.4.6 | Export CSV requirements | Export button | CSV downloads | 🔲 | |
| 7.4.7 | Export CSV scores | Export button | CSV downloads | 🔲 | |

### Block 7 Summary

```
Tests: 24
Passed: ___
Failed: ___
Skipped: ___
Outstanding Issues: ___
```

**Context Check Point**

---

## Testing Block 8: AI Features

**Estimated Time:** 25-30 minutes  
**Prerequisites:** Block 7 complete, documents uploaded

### 8.1 Document Parsing

| ID | Test Case | Steps | Expected Result | Status | Notes |
|----|-----------|-------|-----------------|--------|-------|
| 8.1.1 | AI parse button visible | Check Documents Hub | "Parse with AI" button shown | 🔲 | |
| 8.1.2 | Initiate parsing | Click parse on document | Processing starts | 🔲 | |
| 8.1.3 | Parsed results displayed | Wait for completion | Requirements extracted | 🔲 | |
| 8.1.4 | Review parsed reqs | Check review panel | Parsed requirements listed | 🔲 | |
| 8.1.5 | Confidence shown | Check each parsed req | AI confidence displayed | 🔲 | |
| 8.1.6 | Import selected | Select and import | Requirements created | 🔲 | |
| 8.1.7 | Source attribution | Check imported reqs | source_document_id set | 🔲 | |

### 8.2 Gap Analysis

| ID | Test Case | Steps | Expected Result | Status | Notes |
|----|-----------|-------|-----------------|--------|-------|
| 8.2.1 | Gap analysis button | Check Requirements Hub | "Gap Analysis" button shown | 🔲 | |
| 8.2.2 | Run gap analysis | Click button | Analysis runs | 🔲 | |
| 8.2.3 | Coverage shown | Check results | Coverage percentage displayed | 🔲 | |
| 8.2.4 | Categories analyzed | Check results | Per-category breakdown | 🔲 | |
| 8.2.5 | Suggestions provided | Check suggestions tab | AI suggestions listed | 🔲 | |
| 8.2.6 | Add suggestion | Click add on suggestion | Requirement created | 🔲 | |
| 8.2.7 | Source marked as AI | Check created req | source_type = 'ai' | 🔲 | |

### 8.3 Market Research

| ID | Test Case | Steps | Expected Result | Status | Notes |
|----|-----------|-------|-----------------|--------|-------|
| 8.3.1 | Research button visible | Check Vendors Hub | "Market Research" button shown | 🔲 | |
| 8.3.2 | Run market research | Enter criteria, run | Research executes | 🔲 | |
| 8.3.3 | Vendors suggested | Check results | Potential vendors listed | 🔲 | |
| 8.3.4 | Vendor details shown | Check each result | Company info provided | 🔲 | |
| 8.3.5 | Add to long list | Click add | Vendor created in system | 🔲 | |
| 8.3.6 | Research logged | Check ai_tasks | Task recorded | 🔲 | |

### 8.4 AI Assistant Panel

| ID | Test Case | Steps | Expected Result | Status | Notes |
|----|-----------|-------|-----------------|--------|-------|
| 8.4.1 | Assistant accessible | Click AI assistant icon | Panel opens | 🔲 | |
| 8.4.2 | Context maintained | Ask about current evaluation | Knows current context | 🔲 | |
| 8.4.3 | Requirement help | Ask to improve requirement | Suggestions provided | 🔲 | |
| 8.4.4 | Evaluation help | Ask evaluation question | Relevant answer | 🔲 | |

### Block 8 Summary

```
Tests: 22
Passed: ___
Failed: ___
Skipped: ___
Outstanding Issues: ___
```

**Context Check Point**

---

## Testing Block 9: Permissions & Security

**Estimated Time:** 20-25 minutes  
**Prerequisites:** Multiple users with different roles

### 9.1 Role-Based Access

| ID | Test Case | Steps | Expected Result | Status | Notes |
|----|-----------|-------|-----------------|--------|-------|
| 9.1.1 | Admin sees all | Login as admin | Full access | 🔲 | |
| 9.1.2 | Evaluator limitations | Login as evaluator | Cannot manage users | 🔲 | |
| 9.1.3 | Client restrictions | Login as client | View-only access | 🔲 | |
| 9.1.4 | Vendor portal isolation | Login as vendor | Only own data | 🔲 | |

### 9.2 Data Isolation

| ID | Test Case | Steps | Expected Result | Status | Notes |
|----|-----------|-------|-----------------|--------|-------|
| 9.2.1 | Evaluation scoping | Switch evaluations | Only current eval data | 🔲 | |
| 9.2.2 | Cannot access other orgs | Try direct URL | Access denied | 🔲 | |
| 9.2.3 | Cannot access other evals | Try direct URL | Access denied | 🔲 | |

### 9.3 RLS Verification

| ID | Test Case | Steps | Expected Result | Status | Notes |
|----|-----------|-------|-----------------|--------|-------|
| 9.3.1 | Direct API blocked | Try Supabase API directly | RLS blocks access | 🔲 | |
| 9.3.2 | Correct data returned | Query via app | Only authorized data | 🔲 | |

### Block 9 Summary

```
Tests: 9
Passed: ___
Failed: ___
Skipped: ___
Outstanding Issues: ___
```

---

## Testing Block 10: End-to-End Workflow

**Estimated Time:** 45-60 minutes  
**Prerequisites:** All previous blocks complete

### Full Workflow Test

This test simulates the complete evaluator workflow from start to finish:

| Step | Action | Expected | Status | Notes |
|------|--------|----------|--------|-------|
| 1 | Create new evaluation project | Project created | 🔲 | |
| 2 | Configure stakeholder areas (3) | Areas created | 🔲 | |
| 3 | Configure categories with weights (4) | Weights = 100% | 🔲 | |
| 4 | Create workshop | Workshop scheduled | 🔲 | |
| 5 | Run live capture (10 reqs) | 10 requirements created | 🔲 | |
| 6 | Upload strategy document | Document uploaded | 🔲 | |
| 7 | Parse document with AI | Additional reqs extracted | 🔲 | |
| 8 | Run gap analysis | Gaps identified | 🔲 | |
| 9 | Add AI suggestions (3) | 3 more reqs added | 🔲 | |
| 10 | Submit reqs for review | Status updated | 🔲 | |
| 11 | Approve all requirements | All approved | 🔲 | |
| 12 | Create vendors (4) | 4 vendors in pipeline | 🔲 | |
| 13 | Generate portal access codes | Codes created | 🔲 | |
| 14 | Submit vendor responses (2) | Responses submitted | 🔲 | |
| 15 | Add evidence for vendors | Evidence linked | 🔲 | |
| 16 | Score vendor 1 (all criteria) | Scores recorded | 🔲 | |
| 17 | Score vendor 2 (all criteria) | Scores recorded | 🔲 | |
| 18 | Complete reconciliation | Consensus scores set | 🔲 | |
| 19 | View traceability matrix | Full matrix with data | 🔲 | |
| 20 | Drill down on cell | Full chain visible | 🔲 | |
| 21 | Generate PDF report | Report downloads | 🔲 | |
| 22 | Access client portal | Dashboard loads | 🔲 | |
| 23 | Client approves requirements | Approval recorded | 🔲 | |
| 24 | Vendor ranked correctly | Weighted scores correct | 🔲 | |

### Block 10 Summary

```
Steps: 24
Completed: ___
Failed: ___
Skipped: ___
Outstanding Issues: ___
```

---

## Final Summary

### Overall Test Results

| Block | Tests | Pass | Fail | Skip |
|-------|-------|------|------|------|
| 1. Project Setup | 16 | | | |
| 2. Requirements | 18 | | | |
| 3. Input Capture | 26 | | | |
| 4. Vendor Management | 22 | | | |
| 5. Scoring | 26 | | | |
| 6. Vendor Portal | 18 | | | |
| 7. Traceability | 24 | | | |
| 8. AI Features | 22 | | | |
| 9. Security | 9 | | | |
| 10. E2E Workflow | 24 | | | |
| **TOTAL** | **205** | | | |

### Issues Found

| ID | Block | Test ID | Issue Description | Severity | Status |
|----|-------|---------|-------------------|----------|--------|
| BUG-001 | 1 | 1.1.2 | "Create Evaluation Project" button redirects to Tracker dashboard instead of opening project creation form | High | Open |

### Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Tester | | | |
| Developer | | | |
| Reviewer | | | |

---

## Resume Prompts

### Starting Fresh

```
I'm beginning testing of the Evaluator tool for AMSF001 Project Tracker.

Please read these files:
1. ~/Projects/amsf001-project-tracker/docs/EVALUATOR-TEST-PLAN.md
2. ~/Projects/amsf001-project-tracker/docs/EVALUATOR-IMPLEMENTATION-PLAN.md

I want to start at Block 1: Project Setup & Navigation.

First, let's verify the pre-testing setup is complete, then we'll begin with test 1.1.1.
```

### Resuming After Break

```
I'm continuing testing of the Evaluator tool.

Please read: ~/Projects/amsf001-project-tracker/docs/EVALUATOR-TEST-PLAN.md

Current status:
- Last completed block: [BLOCK X]
- Last completed test: [TEST ID]
- Outstanding issues: [NONE / list issues]

Please help me continue testing from where we left off.
```

### After Finding Failures

```
I'm continuing Evaluator testing but we need to investigate failures first.

Please read: ~/Projects/amsf001-project-tracker/docs/EVALUATOR-TEST-PLAN.md

We found these failures in the last session:
[LIST FAILED TESTS WITH DETAILS]

Should we:
1. Investigate and fix these now, then continue testing
2. Log them for later and continue testing
3. Something else?

Please help me decide and then proceed.
```

---

*Test Plan Version: 1.0*  
*Created: January 4, 2026*  
*Last Updated: January 4, 2026*
