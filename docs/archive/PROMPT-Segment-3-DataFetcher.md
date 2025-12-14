# AI Prompt - Segment 3: Data Fetcher Service

**Copy and paste the content below into a new chat session:**

---

I'm continuing work on the AMSF001 Project Tracker Report Builder Wizard.

Project Location: /Users/glennnickols/Projects/amsf001-project-tracker

Please read:
1. /docs/IMPLEMENTATION-Report-Builder-Wizard.md (this plan)
2. /docs/AMSF001-Technical-Specification.md (for context)

I'm working on **Segment 3: Data Fetcher Service**

The previous segments completed are:
- Segment 1: Database Schema & Service Foundation ✅
- Segment 2: Report Section Type Definitions ✅ (15 section types defined in /src/lib/reportSectionTypes.js)

**What we need to implement:**
- `src/services/reportDataFetcher.service.js` - Service that fetches data for report sections

**Key Methods Required:**
- `fetchSectionData(sectionType, config, context)` - Main entry point
- `getDateRange(periodFilter)` - Date range calculation
- `fetchMilestoneSummary(projectId, config)` - Milestone data
- `fetchDeliverableSummary(projectId, config)` - Deliverable data
- `fetchKPIPerformance(projectId, config)` - KPI data
- `fetchRAIDSummary(projectId, config)` - RAID data
- `fetchForwardLook(projectId, config)` - Forward looking data

**Key Files to Reference:**
- `/src/lib/reportSectionTypes.js` - Section type definitions with data sources
- `/src/services/metrics.service.js` - Existing metrics service to leverage
- `/src/services/raid.service.js` - Existing RAID service to leverage
- `/src/services/base.service.js` - Base service pattern

Let's implement this segment following the plan.

---

**Session Notes:**
- The reportSectionTypes.js defines `dataSource` and `dataMethod` for each section type
- Data sources include: metricsService, raidService, customQuery, userInput, aiGenerated
- Some sections have roleRestriction that should be respected
- Date filtering will use the reporting period parameter from the wizard
