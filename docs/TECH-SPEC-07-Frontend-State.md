# AMSF001 Technical Specification - Frontend State Management

**Document Version:** 5.4
**Created:** 11 December 2025
**Last Updated:** 15 January 2026
**Session:** 1.7.4
**Author:** Claude AI (Anthropic)

> **Version 5.4 Updates (15 January 2026):**
> - Added Section 14.1a: PlannerGrid Component (AG Grid Enterprise)
> - Documented selection sync, checkbox column, WBS column, date synchronization
> - Documents expanded pre-fetched context (RAID, Quality Standards)
> - Documents new local response patterns for instant responses
> - Updated context pre-fetching structure with 9 query sources
>
> **Version 5.3 Updates (7 January 2026):**
> - Added reference to TECH-SPEC-11-Evaluator.md for comprehensive Evaluator module documentation
> - Added Section 8.6: EvaluationContext (cross-reference)
> - Added Section 8.7: ReportBuilderContext (cross-reference)
> - Added Section 15: Evaluator Frontend (summary with cross-reference)
>
> **Version 5.2 Updates (6 January 2026):**
> - Added Section 10.3: UI Utility Hooks
> - Documents useResizableColumns hook for table column resizing
> - Added localStorage persistence pattern documentation
>
> **Version 5.1 Updates (28 December 2025):**
> - Updated Section 9.4: Entity-Specific Permission Hooks
> - Added 3 new hooks: useExpensePermissions, useRaidPermissions, useNetworkStandardPermissions
> - Added Hook Summary Table documenting all 7 entity permission hooks
> - Documents TD-001 completion (Permission Hook Consolidation)
>
> **Version 5.0 Updates (28 December 2025):**
> - Added Section 14: Planning & Estimator Tools
> - Documents Planning.jsx, Estimator.jsx, Benchmarking.jsx pages
> - Documents PlanningAIAssistant, ResourceTypeSelector components
> - Documents EstimateGeneratorModal, EstimateLinkModal components
> **Version 4.0 Updates (24 December 2025):**
> - Added Section 13: New UI Components (Onboarding, Landing Page, Subscription)
> - Documents OnboardingWizard, LandingPage, UpgradePrompt, UsageMeter components
> - Added PendingInvitationCard, OrganisationUsageWidget documentation
>
> **Version 3.0 Updates (24 December 2025):**
> - Updated Section 6: ViewAsContext v3.0 (org admin hierarchy in actualRole)
> - Updated Section 9: Permission System (isOrgLevelAdmin)
> - Updated Section 10: Custom Hooks (usePermissions v5.0)
> - Added org admin → admin effectiveRole mapping
>
> **Version 2.0 Updates (23 December 2025):**
> - Added Section 4: OrganisationContext (new context for multi-tenancy)
> - Added OrganisationSwitcher component documentation
> - Updated Provider Hierarchy (OrganisationProvider between Auth and Project)
> - Updated ProjectContext documentation (now depends on OrganisationContext)
> - Updated data flow diagrams
> - Renumbered subsequent sections  

---

## Table of Contents

1. [Overview](#1-overview)
2. [Context Provider Hierarchy](#2-context-provider-hierarchy)
3. [AuthContext](#3-authcontext)
4. [OrganisationContext](#4-organisationcontext) *(NEW)*
5. [ProjectContext](#5-projectcontext)
6. [ViewAsContext](#6-viewascontext)
7. [ChatContext](#7-chatcontext)
8. [Supporting Contexts](#8-supporting-contexts)
9. [Permission System](#9-permission-system)
10. [Custom Hooks](#10-custom-hooks)
11. [State Management Patterns](#11-state-management-patterns)
12. [Page-Specific State Management](#12-page-specific-state-management)
13. [New UI Components (December 2025)](#13-new-ui-components-december-2025) *(NEW)*
14. [Planning & Estimator Tools](#14-planning--estimator-tools) *(NEW - December 2025)*
15. [Evaluator Frontend](#15-evaluator-frontend) *(NEW - January 2026)*
- [Appendix A: Role Display Configuration](#appendix-a-role-display-configuration)
- [Appendix B: Context Import Patterns](#appendix-b-context-import-patterns)
- [Document History](#document-history)

---

## 1. Overview

The AMSF001 Project Tracker uses React Context API for global state management. The application follows a hierarchical provider pattern where contexts depend on each other in a specific order.

### State Management Architecture

| Aspect | Approach |
|--------|----------|
| Global State | React Context API |
| Local State | React useState/useReducer |
| Persistence | localStorage / sessionStorage |
| Server State | Supabase real-time + service layer |
| Caching | Custom service-level caching |

### Key Principles

1. **Single Source of Truth**: Each piece of state has one authoritative source
2. **Provider Hierarchy**: Contexts are ordered based on dependencies
3. **Permission Scoping**: Role-based access derived from ProjectContext via ViewAsContext
4. **Session vs Persistent**: ViewAs uses sessionStorage (resets on close), project selection uses localStorage

---

## 2. Context Provider Hierarchy

### Provider Nesting Order

The order is critical - each provider depends on those above it:

```

---

## 14. Planning & Estimator Tools

> **Added:** 28 December 2025
> 
> Three new tool pages for project planning and cost estimation.

### 14.1 Planning Page (`/planning`)

**File:** `src/pages/planning/Planning.jsx` (33KB, ~850 lines)

**Purpose:** Excel-like hierarchical grid for Work Breakdown Structure (WBS) management.

**Access Control:**
- Roles: `admin`, `supplier_pm`, `customer_pm`
- Route: `<ProtectedRoute requiredRoles={['admin', 'supplier_pm', 'customer_pm']}>`

**State Management:**

```javascript
const [planItems, setPlanItems] = useState([]);        // All plan items
const [expandedRows, setExpandedRows] = useState({});  // Expand/collapse state
const [selectedCell, setSelectedCell] = useState(null); // Active cell {row, col}
const [editingCell, setEditingCell] = useState(null);  // Cell being edited
const [isLoading, setIsLoading] = useState(true);
const [showAIAssistant, setShowAIAssistant] = useState(false);
const [showEstimateModal, setShowEstimateModal] = useState(false);
```

**Key Features:**

| Feature | Implementation |
|---------|----------------|
| Hierarchical Grid | Nested rows with expand/collapse |
| Keyboard Navigation | Arrow keys, Tab, Enter, Escape |
| Inline Editing | Double-click or Enter to edit |
| Auto-save | Debounced save on cell blur |
| Drag & Drop | Reorder items within same parent |
| WBS Numbering | Auto-calculated (1.0, 1.1, 1.1.1) |
| Progress Tracking | Visual progress bars |
| Status Colors | Status-based row highlighting |

**Grid Columns:**

```javascript
const columns = [
  { key: 'wbs_number', label: 'WBS', width: 80, editable: false },
  { key: 'name', label: 'Name', width: 250, editable: true },
  { key: 'item_type', label: 'Type', width: 100, editable: true },
  { key: 'status', label: 'Status', width: 120, editable: true },
  { key: 'progress', label: 'Progress', width: 100, editable: true },
  { key: 'start_date', label: 'Start', width: 110, editable: true },
  { key: 'end_date', label: 'End', width: 110, editable: true },
  { key: 'estimated_hours', label: 'Est. Hours', width: 90, editable: true },
  { key: 'assigned_to', label: 'Assigned', width: 150, editable: true },
];
```

**Keyboard Handlers:**

```javascript
const handleKeyDown = (e) => {
  switch(e.key) {
    case 'ArrowUp': moveSelection(-1, 0); break;
    case 'ArrowDown': moveSelection(1, 0); break;
    case 'ArrowLeft': moveSelection(0, -1); break;
    case 'ArrowRight': moveSelection(0, 1); break;
    case 'Tab': e.shiftKey ? moveSelection(0, -1) : moveSelection(0, 1); break;
    case 'Enter': editingCell ? saveAndMove() : startEditing(); break;
    case 'Escape': cancelEditing(); break;
    case 'Delete': deleteSelectedItem(); break;
  }
};
```

**Service Integration:**

```javascript
import planItemsService from '../../services/planItems.service';

// Load data
const items = await planItemsService.getByProject(projectId);

// Save cell edit
await planItemsService.update(itemId, { [columnKey]: newValue });

// Create new item
const newItem = await planItemsService.create({ project_id: projectId, ...data });

// Delete item
await planItemsService.delete(itemId);
```

---

### 14.1a PlannerGrid Component (AG Grid Enterprise)

> **Added:** 15 January 2026
>
> AG Grid Enterprise-based hierarchical grid with advanced features.

**File:** `src/components/planning/PlannerGrid.jsx`

**Purpose:** Enterprise-grade tree grid with inline editing, selection sync, and Excel export.

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `items` | Array | Plan items data |
| `onItemUpdate` | Function | Callback for cell edits |
| `onItemCreate` | Function | Callback for new item creation |
| `onItemDelete` | Function | Callback for item deletion |
| `onPredecessorEdit` | Function | Opens predecessor modal |
| `onLinkSelected` | Function | Chain link selected items |
| `onSelectionChanged` | Function | Syncs selection with parent's selectedIds |
| `onRefresh` | Function | Refresh data |
| `isLoading` | Boolean | Loading state |
| `readOnly` | Boolean | Disable editing |
| `teamMembers` | Array | Owner dropdown options |
| `projectName` | String | For Excel export filename |

**Column Configuration:**

| Column | Width | Features |
|--------|-------|----------|
| Checkbox | 50px | Multi-select, pinned left |
| WBS # | 80px | Blue numbers, centered |
| Task Name | flex | Tree hierarchy, expand/collapse |
| Type | 130px | Colored badges (Component/Milestone/Deliverable/Task) |
| Owner | 160px | Rich select dropdown with avatars |
| Start | 130px | Date picker |
| End | 130px | Date picker |
| Duration | 90px | Auto-calculated |
| Pred | 140px | Click to edit predecessors |
| Progress | 120px | Progress bar with % |
| Status | 130px | Set filter dropdown |

**Enterprise Features:**

```javascript
// AG Grid Enterprise modules used
- Tree Data (hierarchy with getDataPath)
- Range Selection & Fill Handle
- Context Menu (right-click actions)
- Excel Export
- Column & Filter Sidebars
- Rich Select Editors
- Date Cell Editor
- Set Column Filters
- Status Bar
```

**Selection Sync:**

```javascript
// Syncs grid selection with parent's selectedIds state
const handleSelectionChanged = useCallback((event) => {
  if (onSelectionChanged) {
    const selectedNodes = event.api.getSelectedNodes();
    const selectedIds = selectedNodes.map(node => node.data?.id).filter(Boolean);
    onSelectionChanged(selectedIds);
  }
}, [onSelectionChanged]);
```

**Date Synchronization:**

```javascript
import { getDateSyncUpdates } from '../../lib/planningDateUtils';

// When date fields change, sync related fields
if (['start_date', 'end_date', 'duration_days'].includes(field)) {
  const updates = getDateSyncUpdates(field, newValue, data);
  onItemUpdate(data.id, updates);
}
```

**Imperative Handle (ref):**

```javascript
useImperativeHandle(ref, () => ({
  getApi: () => gridRef.current?.api,
  toggleFullscreen,
  isFullscreen,
  exportToExcel: (params) => { ... }
}));
```

**CSS File:** `src/components/planning/PlannerGrid.css`

- Monday.com-inspired styling
- Green selected row highlighting
- Type-specific badge colors
- Improved sidebar button readability

---

### 14.2 Planning AI Assistant

**File:** `src/components/planning/PlanningAIAssistant.jsx` (22KB, ~550 lines)

**Purpose:** AI-powered document upload and WBS extraction.

**State Management:**

```javascript
const [messages, setMessages] = useState([]);          // Conversation history
const [inputValue, setInputValue] = useState('');      // User input
const [isLoading, setIsLoading] = useState(false);     // API call in progress
const [uploadedDocument, setUploadedDocument] = useState(null); // File data
const [generatedStructure, setGeneratedStructure] = useState(null); // AI output
```

**Document Upload:**

```javascript
const handleFileUpload = async (file) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = e.target.result.split(',')[1];
    setUploadedDocument({
      data: base64,
      mediaType: file.type,
      fileName: file.name
    });
  };
  reader.readAsDataURL(file);
};
```

**API Integration:**

```javascript
const sendMessage = async (content) => {
  const response = await fetch('/api/planning-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [...messages, { role: 'user', content }],
      projectContext: { projectId, projectName },
      currentStructure: existingPlanItems,
      document: uploadedDocument
    })
  });
  
  const result = await response.json();
  
  if (result.structure) {
    setGeneratedStructure(result.structure);
  }
};
```

**Import Generated Structure:**

```javascript
const importStructure = async () => {
  await planItemsService.importStructure(projectId, generatedStructure);
  onImportComplete(); // Callback to refresh Planning grid
};
```

---

### 14.3 Estimator Page (`/estimator`)

**File:** `src/pages/estimator/Estimator.jsx` (46KB, ~950 lines)

**Purpose:** Component-based cost estimation with SFIA 8 skills framework.

**Access Control:**
- Roles: `admin`, `supplier_pm`
- Route: `<ProtectedRoute requiredRoles={['admin', 'supplier_pm']}>`

**State Management:**

```javascript
// Estimate data
const [estimate, setEstimate] = useState(null);           // Current estimate
const [components, setComponents] = useState([]);          // Estimate components
const [selectedComponent, setSelectedComponent] = useState(null);

// Tasks & Resources
const [tasks, setTasks] = useState([]);                   // Tasks in component
const [resources, setResources] = useState([]);           // Resource allocations

// UI state
const [isLoading, setIsLoading] = useState(true);
const [isSaving, setIsSaving] = useState(false);
const [showResourceSelector, setShowResourceSelector] = useState(false);
const [showSaveDialog, setShowSaveDialog] = useState(false);

// Rate lookup
const [rateLookup, setRateLookup] = useState({});         // SFIA rates cache
```

**Rate Lookup Initialization:**

```javascript
useEffect(() => {
  const loadRates = async () => {
    const rates = await benchmarkRatesService.buildRateLookup();
    setRateLookup(rates);
  };
  loadRates();
}, []);

// Get rate for resource
const getRate = (skillId, sfiaLevel, tierId) => {
  const key = `${skillId}-${sfiaLevel}-${tierId}`;
  return rateLookup[key] || FALLBACK_RATES[tierId];
};
```

**Effort Grid:**

```javascript
// Month columns (12 months)
const months = Array.from({ length: 12 }, (_, i) => {
  const date = new Date(estimate.start_date);
  date.setMonth(date.getMonth() + i);
  return { key: `month_${i}`, label: date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }) };
});

// Calculate row total
const calculateRowTotal = (resource) => {
  return months.reduce((sum, month) => sum + (resource[month.key] || 0), 0);
};

// Calculate cost
const calculateRowCost = (resource) => {
  const days = calculateRowTotal(resource);
  const rate = getRate(resource.skill_id, resource.sfia_level, resource.tier_id);
  return days * rate;
};
```

**Component Totals:**

```javascript
const componentTotal = useMemo(() => {
  const baseCost = resources.reduce((sum, r) => sum + calculateRowCost(r), 0);
  const quantity = selectedComponent?.quantity || 1;
  return baseCost * quantity;
}, [resources, selectedComponent]);
```

**Save Estimate:**

```javascript
const saveEstimate = async () => {
  setIsSaving(true);
  try {
    // Save estimate header
    const savedEstimate = await estimatesService.save(estimate);
    
    // Save components
    for (const component of components) {
      await estimatesService.saveComponent(savedEstimate.id, component);
      
      // Save tasks
      for (const task of component.tasks) {
        await estimatesService.saveTask(component.id, task);
        
        // Save resources
        for (const resource of task.resources) {
          await estimatesService.saveResource(task.id, resource);
        }
      }
    }
    
    toast.success('Estimate saved');
  } finally {
    setIsSaving(false);
  }
};
```

---

### 14.4 Resource Type Selector

**File:** `src/components/estimator/ResourceTypeSelector.jsx`

**Purpose:** Hierarchical SFIA 8 skill/level/tier selection.

**Props:**

```javascript
ResourceTypeSelector.propTypes = {
  onSelect: PropTypes.func.isRequired,  // Callback with selection
  initialValue: PropTypes.object,       // Pre-selected values
  onClose: PropTypes.func.isRequired,   // Close modal
};
```

**State:**

```javascript
const [selectedCategory, setSelectedCategory] = useState(null);
const [selectedSubcategory, setSelectedSubcategory] = useState(null);
const [selectedSkill, setSelectedSkill] = useState(null);
const [selectedLevel, setSelectedLevel] = useState(null);
const [selectedTier, setSelectedTier] = useState('contractor');
```

**SFIA 8 Data:**

```javascript
import { CATEGORIES, SUBCATEGORIES, SKILLS, LEVELS, TIERS } from '../../services/sfia8-reference-data';

// 6 categories, 19 subcategories, 97 skills, 7 levels, 4 tiers
```

**Selection Flow:**

```
Category → Subcategory → Skill → Level → Tier
   ↓           ↓           ↓        ↓       ↓
Strategy   Enterprise   Business  Level 5   Mid
  Dev.     Arch.       Analysis
```

**Output:**

```javascript
const handleConfirm = () => {
  onSelect({
    category_id: selectedCategory.id,
    subcategory_id: selectedSubcategory.id,
    skill_id: selectedSkill.id,
    skill_name: selectedSkill.name,
    sfia_level: selectedLevel,
    tier_id: selectedTier,
    tier_name: TIERS.find(t => t.id === selectedTier).name
  });
  onClose();
};
```

---

### 14.5 Benchmarking Page (`/benchmarking`)

**File:** `src/pages/benchmarking/Benchmarking.jsx` (19KB, ~450 lines)

**Purpose:** SFIA 8 rate comparison and management.

**Access Control:**
- Roles: `admin`, `supplier_pm`
- Route: `<ProtectedRoute requiredRoles={['admin', 'supplier_pm']}>`

**State Management:**

```javascript
const [rates, setRates] = useState([]);                   // All rates
const [selectedCategory, setSelectedCategory] = useState(null);
const [selectedSubcategory, setSelectedSubcategory] = useState(null);
const [expandedCategories, setExpandedCategories] = useState({});
const [viewMode, setViewMode] = useState('table');        // 'table' | 'comparison'
const [isLoading, setIsLoading] = useState(true);
```

**Rate Display:**

```javascript
// Tier comparison view
const tierColumns = [
  { id: 'contractor', label: 'Contractor', multiplier: 1.0 },
  { id: 'boutique', label: 'Boutique', multiplier: 1.3 },
  { id: 'mid', label: 'Mid-Tier', multiplier: 1.5 },
  { id: 'big4', label: 'Big 4', multiplier: 1.9 },
];

// Format rate
const formatRate = (rate) => `£${rate.toLocaleString()}`;
```

**Service Integration:**

```javascript
import benchmarkRatesService from '../../services/benchmarkRates.service';

// Load all rates
const rates = await benchmarkRatesService.getAllRates();

// Get rates by category
const categoryRates = benchmarkRatesService.getRatesByCategory(categoryId);

// Update rate (admin only)
await benchmarkRatesService.updateRate(rateId, { day_rate: newRate });
```

---

### 14.6 Estimate Generator Modal

**File:** `src/components/planning/EstimateGeneratorModal.jsx`

**Purpose:** Generate estimate from plan structure.

**Flow:**

```
Planning Page → "Generate Estimate" button → Modal
                                              ↓
                                    Select plan items
                                              ↓
                                    Configure options
                                              ↓
                                    Create estimate
                                              ↓
                                    Navigate to Estimator
```

**Props:**

```javascript
EstimateGeneratorModal.propTypes = {
  planItems: PropTypes.array.isRequired,  // Items to include
  projectId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onGenerate: PropTypes.func.isRequired,  // Callback with estimate ID
};
```

---

### 14.7 Estimate Link Modal

**File:** `src/components/planning/EstimateLinkModal.jsx`

**Purpose:** Link/unlink plan items to estimate components.

**Features:**
- View linked estimate for plan item
- Link plan item to existing estimate component
- Unlink plan item from estimate
- Navigate to linked estimate

---

### 14.8 File Structure Summary

```
src/
├── pages/
│   ├── planning/
│   │   ├── Planning.jsx              # Main planning page (33KB)
│   │   └── Planning.css
│   ├── estimator/
│   │   ├── Estimator.jsx             # Main estimator page (46KB)
│   │   └── Estimator.css
│   └── benchmarking/
│       ├── Benchmarking.jsx          # Rate comparison (19KB)
│       └── Benchmarking.css
│
├── components/
│   ├── planning/
│   │   ├── PlanningAIAssistant.jsx   # AI document analysis (22KB)
│   │   ├── EstimateGeneratorModal.jsx
│   │   ├── EstimateLinkModal.jsx
│   │   └── index.js
│   └── estimator/
│       ├── ResourceTypeSelector.jsx   # SFIA 8 selector
│       └── index.js
│
└── services/
    ├── planItems.service.js          # Plan CRUD operations
    ├── estimates.service.js          # Estimate CRUD operations
    ├── benchmarkRates.service.js     # Rate lookup & management
    └── sfia8-reference-data.js       # SFIA 8 constants
```jsx
// src/App.jsx (Updated December 2025)
<BrowserRouter>
  <ErrorBoundary>
    <ToastProvider>                    {/* Level 1: No dependencies */}
      <AuthProvider>                   {/* Level 2: Authentication */}
        <OrganisationProvider>         {/* Level 3: Needs AuthContext (NEW) */}
          <ProjectProvider>            {/* Level 4: Needs Auth + Organisation */}
            <ViewAsProvider>           {/* Level 5: Needs Auth + Project */}
              <TestUserProvider>       {/* Level 6: Needs AuthContext */}
                <MetricsProvider>      {/* Level 7: Needs ProjectContext */}
                  <NotificationProvider> {/* Level 8: Needs AuthContext */}
                    <ChatProvider>     {/* Level 9: Needs Auth + Project */}
                      <HelpProvider>   {/* Level 10: No dependencies */}
                        <Routes />
                      </HelpProvider>
                    </ChatProvider>
                  </NotificationProvider>
                </MetricsProvider>
              </TestUserProvider>
            </ViewAsProvider>
          </ProjectProvider>
        </OrganisationProvider>
      </AuthProvider>
    </ToastProvider>
  </ErrorBoundary>
</BrowserRouter>
```

### Provider Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                        ToastProvider                            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                      AuthProvider                         │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │              OrganisationProvider (NEW)              │  │  │
│  │  │  ┌───────────────────────────────────────────────┐  │  │  │
│  │  │  │                  ProjectProvider                  │  │  │  │
│  │  │  │  ┌─────────────────────────────────────────┐  │  │  │  │
│  │  │  │  │               ViewAsProvider                  │  │  │  │  │
│  │  │  │  │  ┌───────────────────────────────────┐  │  │  │  │  │
│  │  │  │  │  │          TestUserProvider               │  │  │  │  │  │
│  │  │  │  │  │  ┌─────────────────────────────┐  │  │  │  │  │  │
│  │  │  │  │  │  │        MetricsProvider            │  │  │  │  │  │  │
│  │  │  │  │  │  │  ┌───────────────────────┐  │  │  │  │  │  │  │
│  │  │  │  │  │  │  │ NotificationProvider  │  │  │  │  │  │  │  │
│  │  │  │  │  │  │  │  ┌─────────────────┐  │  │  │  │  │  │  │  │
│  │  │  │  │  │  │  │  │   ChatProvider   │  │  │  │  │  │  │  │  │
│  │  │  │  │  │  │  │  │  ┌───────────┐  │  │  │  │  │  │  │  │  │
│  │  │  │  │  │  │  │  │  │HelpProvider│  │  │  │  │  │  │  │  │  │
│  │  │  │  │  │  │  │  │  │  <Routes/> │  │  │  │  │  │  │  │  │  │
│  │  │  │  │  │  │  │  │  └───────────┘  │  │  │  │  │  │  │  │  │
│  │  │  │  │  │  │  │  └─────────────────┘  │  │  │  │  │  │  │  │
│  │  │  │  │  │  │  └───────────────────────┘  │  │  │  │  │  │  │
│  │  │  │  │  │  └─────────────────────────────┘  │  │  │  │  │  │
│  │  │  │  │  └───────────────────────────────────┘  │  │  │  │  │
│  │  │  │  └─────────────────────────────────────────┘  │  │  │  │
│  │  │  └───────────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow (Updated December 2025)

```
User Login
    ↓
AuthProvider (user, profile, linkedResource)
    ↓
OrganisationProvider (fetches user's orgs, current org, orgRole)  ← NEW
    ↓
ProjectProvider (fetches projects filtered by organisation_id)
    ↓
ViewAsProvider (derives effectiveRole from projectRole)
    ↓
usePermissions() hook (uses effectiveRole for all checks)
    ↓
Components render based on permissions
```

---

## 3. AuthContext

**File:** `src/contexts/AuthContext.jsx`  
**Version:** 5.0  

### Purpose

Manages user authentication state, profile data, linked resource information, and session management.

### State Structure

```javascript
{
  user: Object | null,           // Supabase auth user
  profile: Object | null,        // profiles table data
  linkedResource: Object | null, // resources table (if linked)
  isLoading: boolean,
  error: Error | null,
  sessionExpiring: boolean,      // Warning flag for near-expiry
  mustChangePassword: boolean    // Force password change flag
}
```

### Exported Values

| Export | Type | Description |
|--------|------|-------------|
| `user` | Object | Supabase auth user object |
| `profile` | Object | User profile from profiles table |
| `role` | string | User's global role (from profile) |
| `linkedResource` | Object | Associated resource record (if any) |
| `isLoading` | boolean | Auth state loading indicator |
| `error` | Error | Any auth error |
| `isAuthenticated` | boolean | Whether user is logged in |
| `sessionExpiring` | boolean | Session nearing expiry |
| `mustChangePassword` | boolean | Forced password change required |

### Exported Functions

| Function | Description |
|----------|-------------|
| `signOut()` | Signs out the user and clears state |
| `refreshUserData()` | Re-fetches profile and linked resource |
| `refreshSession()` | Manually refreshes the auth session |
| `clearMustChangePassword()` | Clears the password change flag |

### Session Management

The AuthContext includes proactive session management:

- **Session Check Interval:** 60 seconds
- **Expiry Warning Threshold:** 5 minutes before expiry
- **Auto-refresh:** Attempts to refresh session when nearing expiry
- **Visibility Change:** Checks session when user returns to tab
- **Activity Tracking:** Monitors user activity for potential idle timeout

```javascript
// Session configuration constants
const SESSION_CHECK_INTERVAL = 60 * 1000;       // 60 seconds
const EXPIRY_WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes
```

### Authentication Flow

```
1. App mounts → AuthProvider initializes
2. supabase.auth.getSession() → Check existing session
3. If session exists:
   - Set user state
   - Fetch profile from profiles table
   - Fetch linked resource from resources table
   - Start session monitoring
4. supabase.auth.onAuthStateChange → Listen for changes
5. On login/logout → Update all state accordingly
```

### Usage Example

```javascript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { 
    user, 
    profile, 
    role, 
    linkedResource,
    isAuthenticated,
    signOut 
  } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return (
    <div>
      <p>Welcome, {profile?.full_name}</p>
      <p>Role: {role}</p>
      <button onClick={signOut}>Logout</button>
    </div>
  );
}
```

---

## 4. OrganisationContext (NEW - December 2025)

**File:** `src/contexts/OrganisationContext.jsx`  
**Version:** 1.0  

### Purpose

Manages organisation-level state for multi-tenancy support. Fetches user's organisation memberships, tracks current organisation selection, and provides organisation-scoped role information.

### State Structure

```javascript
{
  // Current organisation
  currentOrganisation: Object | null,  // Full organisation object
  organisationId: UUID | null,         // Current org ID shortcut
  organisationName: string | null,     // Current org name shortcut
  organisationSlug: string | null,     // URL-friendly identifier
  
  // Organisation-scoped role
  orgRole: 'org_owner' | 'org_admin' | 'org_member' | null,
  isOrgAdmin: boolean,                 // org_owner OR org_admin
  isOrgOwner: boolean,                 // org_owner only
  isSystemAdmin: boolean,              // profiles.role === 'admin'
  
  // Multi-org support
  availableOrganisations: Array,       // All orgs user belongs to
  hasMultipleOrganisations: boolean,   // Show org switcher?
  
  // Organisation settings (with defaults)
  orgSettings: {
    features: { ai_chat_enabled, receipt_scanner_enabled, ... },
    defaults: { currency, hours_per_day, date_format, timezone },
    branding: {},
    limits: {}
  },
  
  // Loading state
  isLoading: boolean,
  error: Error | null
}
```

### Organisation Roles

| Role | Constant | Description |
|------|----------|-------------|
| `org_owner` | `ORG_ROLES.ORG_OWNER` | Full control including billing and deletion |
| `org_admin` | `ORG_ROLES.ORG_ADMIN` | Manage members, settings, and all projects |
| `org_member` | `ORG_ROLES.ORG_MEMBER` | Access only assigned projects |

### Actions

```javascript
// Switch to a different organisation
switchOrganisation(organisationId: UUID): boolean

// Refresh current organisation data (e.g., after settings update)
refreshOrganisation(): Promise<void>

// Refresh all organisation memberships
refreshOrganisationMemberships(): Promise<void>
```

### Hook Usage

```javascript
import { useOrganisation } from '../contexts/OrganisationContext';

function MyComponent() {
  const {
    currentOrganisation,
    organisationId,
    orgRole,
    isOrgAdmin,
    availableOrganisations,
    hasMultipleOrganisations,
    switchOrganisation,
    orgSettings
  } = useOrganisation();
  
  // Check organisation-level permissions
  if (isOrgAdmin) {
    // Can access all projects in this org
  }
  
  // Access org settings
  const currency = orgSettings.defaults.currency; // 'GBP'
}
```

### Helper Functions

```javascript
import { isOrgAdminRole, isOrgOwnerRole, ORG_ROLES, ORG_ROLE_CONFIG } from '../contexts/OrganisationContext';

// Check if a role is admin-level
isOrgAdminRole('org_admin')  // true
isOrgAdminRole('org_member') // false

// Check if a role is owner
isOrgOwnerRole('org_owner')  // true

// Get role display config
ORG_ROLE_CONFIG[ORG_ROLES.ORG_ADMIN]
// { label: 'Admin', color: '#059669', bg: '#d1fae5', description: '...' }
```

### Persistence

Organisation selection is persisted in localStorage:
- **Key:** `amsf_current_organisation_id`
- **Restore:** On login, restores previous selection if still valid
- **Fallback:** Default org → First available org

### OrganisationSwitcher Component

**File:** `src/components/OrganisationSwitcher.jsx`

Dropdown component for switching between organisations. Only renders when `hasMultipleOrganisations` is true.

```jsx
import OrganisationSwitcher from '../components/OrganisationSwitcher';

// In header/navigation
<OrganisationSwitcher />
```

**Test IDs:**
- `org-switcher-button`
- `org-switcher-dropdown`
- `org-switcher-item-{orgId}`

---

## 5. ProjectContext

**File:** `src/contexts/ProjectContext.jsx`  
**Version:** 6.0 (Updated December 2025)  

### Purpose

Manages project selection and project-scoped roles. **Now depends on OrganisationContext** - projects are filtered by the current organisation.

> **December 2025 Update:** ProjectContext now imports `useOrganisation()` and filters available projects by `organisation_id`. Org admins (org_owner, org_admin) can see all projects in their organisation without explicit project membership.

Manages multi-tenancy by tracking the user's assigned projects and current project selection. Provides project-scoped role information.

### State Structure

```javascript
{
  availableProjects: Array,    // User's project assignments with project details
  currentProjectId: string,    // Selected project ID
  isLoading: boolean,
  error: Error | null
}
```

### Derived Values

| Value | Source | Description |
|-------|--------|-------------|
| `currentProject` | Computed | Full project object for current selection |
| `projectRole` | Computed | User's role for current project (from user_projects) |
| `hasMultipleProjects` | Computed | Whether user has >1 project |

### Exported Values

| Export | Type | Description |
|--------|------|-------------|
| `currentProject` | Object | Full project object |
| `projectId` | string | Current project ID |
| `projectRef` | string | Project reference code |
| `projectName` | string | Project display name |
| `projectRole` | string | User's role for this project |
| `availableProjects` | Array | All user's project assignments |
| `hasMultipleProjects` | boolean | Show project switcher |
| `isLoading` | boolean | Loading indicator |
| `error` | Error | Any error |

### Exported Functions

| Function | Description |
|----------|-------------|
| `switchProject(projectId)` | Changes the current project |
| `refreshProject()` | Re-fetches current project data |
| `refreshProjectAssignments()` | Re-fetches all user's projects |

### Project Selection Logic

1. **Restore from localStorage:** Check for previously selected project
2. **Validate assignment:** Ensure user still has access to stored project
3. **Fall back to default:** Use project marked as `is_default` in user_projects
4. **Fall back to first:** Use first available project

```javascript
// localStorage key
const PROJECT_STORAGE_KEY = 'amsf_current_project_id';
```

### Multi-Tenancy Data Model

```
users (Supabase auth)
    ↓ 1:1
profiles
    ↓ 1:N
user_projects (junction table)
    ↓ N:1
projects

user_projects structure:
- id (uuid)
- user_id (uuid) → profiles.id
- project_id (uuid) → projects.id
- role (text) - project-scoped role
- is_default (boolean)
```

### Usage Example

```javascript
import { useProject } from '../contexts/ProjectContext';

function ProjectSwitcher() {
  const { 
    currentProject,
    availableProjects,
    hasMultipleProjects,
    switchProject 
  } = useProject();
  
  if (!hasMultipleProjects) return null;
  
  return (
    <select 
      value={currentProject?.id}
      onChange={(e) => switchProject(e.target.value)}
    >
      {availableProjects.map(({ project }) => (
        <option key={project.id} value={project.id}>
          {project.name}
        </option>
      ))}
    </select>
  );
}
```

---

## 6. ViewAsContext

**File:** `src/contexts/ViewAsContext.jsx`  
**Version:** 3.0 (Updated December 2025 for org admin hierarchy)  

### Purpose

Enables role impersonation for admin and supplier_pm users. Allows previewing the application as different roles without logging out. **Version 3.0** also respects the organisation admin hierarchy - org admins automatically get `admin` effective role within their organisation.

### State Structure

```javascript
{
  viewAsRole: string | null,  // Impersonated role (null if not impersonating)
  isInitialized: boolean      // Context initialization complete
}
```

### Role Resolution Chain (Updated v3.0)

```
1. Is user a System Admin? (profiles.role === 'admin')
   YES → actualRole = 'admin'
        ↓
2. Is user an Org Admin? (user_organisations.org_role === 'org_admin')
   YES → actualRole = 'admin'
        ↓
3. Has project role? (user_projects.role)
   YES → actualRole = projectRole
        ↓
4. Fallback to viewer
   actualRole = 'viewer'
        ↓
5. If viewAsRole is set AND canUseViewAs:
   effectiveRole = viewAsRole
   Else:
   effectiveRole = actualRole
```

> **Key Change in v3.0:** Org admins now automatically get `effectiveRole = 'admin'` 
> even without explicit project membership. This enables them to see the full
> admin sidebar and access admin features within their organisation.

### Permission to Use View As

Only `admin` and `supplier_pm` can use the View As feature:

```javascript
const CAN_USE_VIEW_AS_ROLES = [ROLES.ADMIN, ROLES.SUPPLIER_PM];
```

### Available Impersonation Roles

```javascript
const IMPERSONATION_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'supplier_pm', label: 'Supplier PM' },
  { value: 'customer_pm', label: 'Customer PM' },
  { value: 'contributor', label: 'Contributor' },
  { value: 'viewer', label: 'Viewer' },
];
```

### Exported Values

| Export | Type | Description |
|--------|------|-------------|
| `canUseViewAs` | boolean | Whether current user can impersonate |
| `isInitialized` | boolean | Context ready |
| `actualRole` | string | User's true role for current project |
| `effectiveRole` | string | Role used for permissions (may be impersonated) |
| `viewAsRole` | string | Currently impersonated role |
| `globalRole` | string | Role from profiles (fallback) |
| `projectRole` | string | Role from user_projects |
| `isImpersonating` | boolean | Whether actively impersonating |
| `isSystemAdmin` | boolean | True if profiles.role = 'admin' (NEW v3.0) |
| `isOrgAdmin` | boolean | True if org_role = 'org_admin' (NEW v3.0) |
| `effectiveRoleConfig` | Object | Display config for effective role |
| `actualRoleConfig` | Object | Display config for actual role |
| `availableRoles` | Array | Roles available for impersonation |
| `debugInfo` | Object | All role info for debugging |

### Exported Functions

| Function | Description |
|----------|-------------|
| `setViewAs(role)` | Set impersonation role |
| `clearViewAs()` | Reset to actual role |

### Storage

```javascript
// sessionStorage key (clears when browser closes)
const VIEW_AS_STORAGE_KEY = 'amsf_view_as_role';
```

### Auto-Clear Behavior

View As is automatically cleared when:
- User logs out
- User switches to a project where they're not admin/supplier_pm
- Browser session ends

### Usage Example

```javascript
import { useViewAs } from '../contexts/ViewAsContext';

function ViewAsBar() {
  const { 
    canUseViewAs,
    isImpersonating,
    effectiveRole,
    actualRole,
    setViewAs,
    clearViewAs,
    availableRoles 
  } = useViewAs();
  
  if (!canUseViewAs) return null;
  
  return (
    <div className="view-as-bar">
      <span>Viewing as: </span>
      <select 
        value={effectiveRole}
        onChange={(e) => setViewAs(e.target.value)}
      >
        {availableRoles.map(role => (
          <option key={role.value} value={role.value}>
            {role.label}
          </option>
        ))}
      </select>
      {isImpersonating && (
        <button onClick={clearViewAs}>Reset</button>
      )}
    </div>
  );
}
```

---

## 7. ChatContext

**File:** `src/contexts/ChatContext.jsx`  
**Version:** 4.0 (Updated 7 January 2026)  

### Purpose

Manages AI chat state including message history, API communication, streaming responses, and local response generation.

### State Structure

```javascript
{
  isOpen: boolean,              // Chat panel open/closed
  messages: Array,              // Chat history
  isLoading: boolean,           // Request in progress
  isLoadingContext: boolean,    // Context pre-fetch in progress
  error: string | null,         // Current error
  retryCount: number,           // Retry attempt counter
  tokenUsage: Object,           // Usage tracking
  prefetchedContext: Object     // Pre-loaded project context
}
```

### Message Structure

```javascript
{
  role: 'user' | 'assistant',
  content: string,
  timestamp: string,           // ISO timestamp
  toolsUsed: boolean,          // Whether tools were invoked
  cached: boolean,             // Response from cache
  local: boolean,              // Generated locally
  streaming: boolean,          // Currently streaming
  tokens: {
    input: number,
    output: number
  }
}
```

### Hybrid Architecture Paths

The ChatContext implements three response paths:

1. **Local Path (Instant):** Pattern-matched queries answered from pre-fetched context
2. **Streaming Path (Haiku):** Simple queries using streaming API
3. **Standard Path (Sonnet):** Complex queries requiring tool calls

```javascript
// Local response patterns (expanded in v4.0)
const LOCAL_RESPONSE_PATTERNS = [
  { pattern: /budget|spend/i, type: 'budget' },
  { pattern: /how many milestones/i, type: 'milestoneCount' },
  { pattern: /status|overview|summary/i, type: 'overview' },
  { pattern: /^how many (open )?(risks|issues)/i, type: 'raidCount' },
  { pattern: /raid.*(summary|overview)/i, type: 'raidSummary' },
  { pattern: /quality.*(status|summary|compliance)/i, type: 'qualitySummary' },
  // ...more patterns
];

// Streaming-eligible patterns
const STREAMING_PATTERNS = [
  /budget|spend|cost|variance/i,
  /milestone.*(status|progress|summary)/i,
  // ...more patterns
];
```

### Context Pre-fetching

When the chat opens, context is pre-fetched for instant responses:

```javascript
// Fetches from /api/chat-context (expanded in v4.0)
const prefetchedContext = {
  budgetSummary: { projectBudget, actualSpend, variance, percentUsed },
  milestoneSummary: { total, byStatus },
  deliverableSummary: { total, byStatus },
  timesheetSummary: { totalEntries, totalHours, byStatus },
  expenseSummary: { totalAmount, chargeableAmount, nonChargeableAmount },
  raidSummary: { total, openRisks, openIssues, highPriority, byType },
  qualityStandardsSummary: { total, compliant, nonCompliant, complianceRate },
  pendingActions: { draftTimesheets, awaitingValidation, hasPending }
};
```

### Storage

```javascript
const CHAT_STORAGE_KEY = 'amsf-chat-history';
const MAX_STORED_MESSAGES = 50;
```

### Retry Configuration

```javascript
const RETRY_CONFIG = {
  maxRetries: 2,
  baseDelayMs: 1000,
  retryableCodes: [429, 503, 504],
};
```

### Exported Values

| Export | Type | Description |
|--------|------|-------------|
| `isOpen` | boolean | Chat panel visibility |
| `messages` | Array | Message history |
| `isLoading` | boolean | Request in progress |
| `isLoadingContext` | boolean | Context loading |
| `error` | string | Current error message |
| `retryCount` | number | Current retry attempt |
| `tokenUsage` | Object | Cumulative token usage |

### Exported Functions

| Function | Description |
|----------|-------------|
| `setIsOpen(boolean)` | Set chat visibility |
| `toggleChat()` | Toggle visibility |
| `sendMessage(content)` | Send message to AI |
| `clearChat()` | Clear message history |
| `resetAllStats()` | Clear history and token usage |
| `cancelRequest()` | Cancel pending request |
| `dismissError()` | Clear error state |
| `exportChat()` | Export as markdown |
| `downloadChat()` | Download as file |
| `copyMessage(content)` | Copy to clipboard |

---

## 8. Supporting Contexts

### 8.1 MetricsContext

**File:** `src/contexts/MetricsContext.jsx`  
**Version:** 1.0  

Provides centralized, cached metrics to all components.

```javascript
// Exposed metrics
{
  milestones: Object,
  deliverables: Object,
  kpis: Object,
  qualityStandards: Object,
  timesheets: Object,
  expenses: Object,
  resources: Object,
  certificates: Object,
  billable: Object,
  milestoneSpend: Object,
  projectProgress: number
}

// Actions
refreshMetrics()      // Full refresh
refreshCategory(name) // Partial refresh
clearCache()          // Clear service cache
```

### 8.2 NotificationContext

**File:** `src/contexts/NotificationContext.jsx`  

Manages workflow notifications and pending action counts.

```javascript
// State
{
  notifications: Array,
  unreadCount: number,
  actionCount: number,
  loading: boolean
}

// Functions
fetchNotifications()
markAsRead(id)
markAsActioned(id)
markAllAsRead()
dismissNotification(id)
```

### 8.3 ToastContext

**File:** `src/contexts/ToastContext.jsx`  
**Version:** 1.1  

Provides application-wide toast notifications.

```javascript
// Functions
showToast(message, type, duration)
showSuccess(message)
showError(message)
showWarning(message)
showInfo(message)
removeToast(id)
```

### 8.4 HelpContext

**File:** `src/contexts/HelpContext.jsx`  
**Version:** 1.0  

Manages help drawer state and current topic.

```javascript
// State
{
  isOpen: boolean,
  currentTopic: string
}

// Functions
openHelp(topic?)
closeHelp()
toggleHelp()
navigateToTopic(topic)
```

Keyboard shortcuts: `?` or `F1` to toggle, `Escape` to close.

### 8.5 TestUserContext

**File:** `src/contexts/TestUserContext.jsx`  

Manages visibility of test users and their content.

```javascript
// State
{
  showTestUsers: boolean,
  testUserIds: Array,
  userRole: string
}

// Functions
toggleTestUsers()
isTestUser(userId)
filterTestContent(items, field)
filterByTestFlag(items)

// Computed
canToggleTestUsers: boolean  // Only admin/supplier_pm
```

### 8.6 EvaluationContext

**File:** `src/contexts/EvaluationContext.jsx`  
**Version:** 1.0  

> **Reference:** See **TECH-SPEC-11-Evaluator.md Section 4** for comprehensive documentation.

Manages evaluation project state for the Evaluator module. Provides current evaluation context, loaded data, and evaluation-specific operations.

```javascript
// State
{
  currentEvaluation: Object,    // Active evaluation project
  evaluationId: UUID,           // Current evaluation ID
  requirements: Array,          // Loaded requirements
  vendors: Array,               // Loaded vendors
  stakeholders: Array,          // Stakeholders and areas
  isLoading: boolean,
  error: Error | null
}

// Functions
loadEvaluation(id)              // Load evaluation by ID
refreshEvaluation()             // Refresh current data
switchEvaluation(id)            // Switch to different evaluation
clearEvaluation()               // Clear current evaluation
```

### 8.7 ReportBuilderContext

**File:** `src/contexts/ReportBuilderContext.jsx`  
**Version:** 1.0  

> **Reference:** See **TECH-SPEC-11-Evaluator.md Section 4** for comprehensive documentation.

Manages report builder state for generating evaluation reports.

```javascript
// State
{
  reportConfig: Object,         // Report configuration
  selectedSections: Array,      // Sections to include
  generatedReport: Object,      // Generated report data
  isGenerating: boolean,
  error: Error | null
}

// Functions
setReportConfig(config)         // Update report settings
toggleSection(sectionId)        // Toggle section inclusion
generateReport()                // Generate report
downloadReport(format)          // Download as PDF/DOCX
clearReport()                   // Clear generated report
```

---

## 9. Permission System

### 9.1 Permission Matrix

**File:** `src/lib/permissionMatrix.js`  

The permission matrix is the **single source of truth** for all role-based permissions.

#### Role Constants

```javascript
export const ROLES = {
  ADMIN: 'admin',
  SUPPLIER_PM: 'supplier_pm',
  CUSTOMER_PM: 'customer_pm',
  CONTRIBUTOR: 'contributor',
  VIEWER: 'viewer'
};
```

#### Role Groupings

```javascript
const ALL_ROLES = [ADMIN, SUPPLIER_PM, CUSTOMER_PM, CONTRIBUTOR, VIEWER];
const AUTHENTICATED = ALL_ROLES;
const MANAGERS = [ADMIN, SUPPLIER_PM, CUSTOMER_PM];
const SUPPLIER_SIDE = [ADMIN, SUPPLIER_PM];
const CUSTOMER_SIDE = [ADMIN, CUSTOMER_PM];
const WORKERS = [ADMIN, SUPPLIER_PM, CONTRIBUTOR];
const ADMIN_ONLY = [ADMIN];
```

#### Matrix Structure

```javascript
export const PERMISSION_MATRIX = {
  timesheets: {
    view: AUTHENTICATED,
    create: WORKERS,
    createForOthers: SUPPLIER_SIDE,
    edit: WORKERS,
    delete: SUPPLIER_SIDE,
    submit: WORKERS,
    approve: CUSTOMER_SIDE,
  },
  expenses: {
    view: AUTHENTICATED,
    create: WORKERS,
    validateChargeable: CUSTOMER_SIDE,
    validateNonChargeable: SUPPLIER_SIDE,
    // ...
  },
  milestones: {
    view: AUTHENTICATED,
    create: SUPPLIER_SIDE,
    edit: SUPPLIER_SIDE,
    delete: ADMIN_ONLY,
    useGantt: SUPPLIER_SIDE,
    editBilling: SUPPLIER_SIDE,
  },
  deliverables: {
    view: AUTHENTICATED,
    create: [...MANAGERS, CONTRIBUTOR],
    edit: [...MANAGERS, CONTRIBUTOR],
    delete: SUPPLIER_SIDE,
    submit: WORKERS,
    review: CUSTOMER_SIDE,
    markDelivered: CUSTOMER_SIDE,
  },
  resources: {
    view: AUTHENTICATED,
    manage: SUPPLIER_SIDE,
    delete: ADMIN_ONLY,
    seeCostPrice: SUPPLIER_SIDE,
    seeMargins: SUPPLIER_SIDE,
    // ...
  },
  variations: {
    view: AUTHENTICATED,
    create: SUPPLIER_SIDE,
    signAsSupplier: SUPPLIER_SIDE,
    signAsCustomer: CUSTOMER_SIDE,
    reject: MANAGERS,
    // ...
  },
  certificates: {
    view: MANAGERS,
    create: MANAGERS,
    signAsSupplier: SUPPLIER_SIDE,
    signAsCustomer: CUSTOMER_SIDE,
  },
  // ...more entities
};
```

#### Core Permission Function

```javascript
export function hasPermission(role, entity, action) {
  const entityPerms = PERMISSION_MATRIX[entity];
  if (!entityPerms) return false;
  
  const allowedRoles = entityPerms[action];
  if (!allowedRoles) return false;
  
  return allowedRoles.includes(role);
}
```

### 9.2 Permission Helpers

**File:** `src/lib/permissions.js`  

Provides backward-compatible function exports and object-level permission checks.

#### Simple Permission Functions

```javascript
// Direct matrix lookups
canAddTimesheet(role)           // hasPermission(role, 'timesheets', 'create')
canApproveTimesheets(role)      // hasPermission(role, 'timesheets', 'approve')
canCreateMilestone(role)        // hasPermission(role, 'milestones', 'create')
canEditDeliverable(role)        // hasPermission(role, 'deliverables', 'edit')
canManageResources(role)        // hasPermission(role, 'resources', 'manage')
canSeeCostPrice(role)           // hasPermission(role, 'resources', 'seeCostPrice')
canSignAsSupplier(role)         // hasPermission(role, 'certificates', 'signAsSupplier')
// ...many more
```

#### Object-Level Permission Functions

These consider both role AND object state (status, ownership):

```javascript
// Timesheet permissions
canEditTimesheet(role, timesheet, userId)
canDeleteTimesheet(role, timesheet, userId)
canSubmitTimesheet(role, timesheet, userId)

// Expense permissions
canEditExpense(role, expense, userId)
canDeleteExpense(role, expense, userId)
canValidateExpense(role, expense)

// Deliverable permissions
canUpdateDeliverableStatus(role, deliverable, userId)
```

#### Resource Filtering Helpers

```javascript
// Get resources available for dropdown based on role
getAvailableResourcesForEntry(role, resources, userId)

// Get user's own resource
getCurrentUserResource(resources, userId)

// Get default resource for new entry
getDefaultResourceForEntry(role, resources, userId)
getDefaultResourceId(role, resources, userId)
```

### 9.3 usePermissions Hook

**File:** `src/hooks/usePermissions.js`  
**Version:** 5.0 (Updated December 2025)  

The primary interface for permission checks in components.

#### Key Features

1. Uses `effectiveRole` from ViewAsContext (supports impersonation)
2. Pre-binds user context to permission functions
3. Provides both simple and object-based permission checks
4. **v5.0:** Exports organisation-level admin flags

#### New Exports (v5.0)

| Export | Type | Description |
|--------|------|-------------|
| `isSystemAdmin` | boolean | True if profiles.role = 'admin' |
| `isOrgAdmin` | boolean | True if user is org admin for current org |
| `isOrgLevelAdmin` | boolean | Computed: `isSystemAdmin \|\| isOrgAdmin` |

#### Usage

```javascript
import { usePermissions } from '../hooks/usePermissions';

function MyComponent({ expense }) {
  const { 
    // Role info
    userRole,
    actualRole,
    isImpersonating,
    
    // Organisation-level admin flags (NEW v5.0)
    isSystemAdmin,
    isOrgAdmin,
    isOrgLevelAdmin,
    
    // Simple permissions (boolean)
    canAddTimesheet,
    canApproveTimesheets,
    canCreateMilestone,
    canSeeCostPrice,
    
    // Object-based permissions (functions)
    canEditExpense,
    canDeleteExpense,
    canValidateExpense,
    
    // Direct matrix access
    can,
    
    // Resource helpers
    getAvailableResources,
    getDefaultResourceId,
  } = usePermissions();
  
  // Check organisation-level admin (NEW)
  if (isOrgLevelAdmin) {
    // Show admin UI for system admins and org admins
  }
  
  // Simple check
  if (canAddTimesheet) { /* show add button */ }
  
  // Object check
  if (canEditExpense(expense)) { /* show edit button */ }
  
  // Direct matrix check
  if (can('deliverables', 'review')) { /* show review button */ }
}
```

### 9.4 Entity-Specific Permission Hooks

> **Updated:** 28 December 2025 (TD-001 Complete)
> 
> All entity-specific permission hooks now follow a consistent pattern where modals use hooks internally instead of receiving permission props from parent pages.

#### Hook Summary Table

| Hook | Entity | Created | Modal Consumer |
|------|--------|---------|----------------|
| `useMilestonePermissions` | Milestones, Certificates | Pre-existing | `CertificateModal` |
| `useDeliverablePermissions` | Deliverables | Pre-existing | `DeliverableDetailModal` |
| `useTimesheetPermissions` | Timesheets | Pre-existing | `TimesheetDetailModal` |
| `useResourcePermissions` | Resources | Pre-existing | `ResourceDetailModal` |
| `useExpensePermissions` | Expenses | TD-001 | `ExpenseDetailModal` |
| `useRaidPermissions` | RAID Items | TD-001 | `RaidDetailModal` |
| `useNetworkStandardPermissions` | Network Standards | TD-001 | `NetworkStandardDetailModal` |

#### useMilestonePermissions

```javascript
const {
  canEdit,
  canEditBaseline,
  canSignBaselineAsSupplier,
  canSignBaselineAsCustomer,
  canResetBaseline,
  canGenerateCertificate,
  canSignCertificateAsSupplier,
  canSignCertificateAsCustomer,
  isBaselineLocked,
} = useMilestonePermissions(milestone);
```

#### useDeliverablePermissions

```javascript
const {
  canView,
  canCreate,
  canEdit,
  canDelete,
  canSubmit,
  canReview,
  canAcceptReview,
  canRejectReview,
  canInitiateSignOff,
  canSignAsSupplier,
  canSignAsCustomer,
  canAssessKPIsAndQS,
  isComplete,
  isEditable,
} = useDeliverablePermissions(deliverable);
```

#### useTimesheetPermissions

```javascript
const {
  canAdd,
  canAddForOthers,
  canValidateAny,
  canEdit,
  canDelete,
  canSubmit,
  canValidate,
  canReject,
  isOwner,
  isEditable,
  isComplete,
  getAvailableResources,
  getDefaultResourceId,
} = useTimesheetPermissions(timesheet);
```

#### useResourcePermissions

```javascript
const {
  canView,
  canCreate,
  canEdit,
  canDelete,
  canManage,
  canSeeSellPrice,
  canSeeCostPrice,
  canSeeMargins,
  canSeeResourceType,
  canEditFinancials,
  canLinkToPartner,
  canViewPartner,
  isOwnResource,
} = useResourcePermissions(resource);
```

#### useExpensePermissions (NEW - TD-001)

**File:** `src/hooks/useExpensePermissions.js`

Provides expense-specific permissions considering ownership, status, and chargeable type.

```javascript
const {
  canView,
  canCreate,
  canEdit,
  canDelete,
  canSubmit,
  canValidate,
  canReject,
  isOwner,
  isEditable,
  isComplete,
} = useExpensePermissions(expense);
```

**Key Logic:**
- `canEdit`: Requires ownership (or supplier-side role) AND draft/rejected status
- `canValidate`: Customer-side for chargeable, supplier-side for non-chargeable
- `isEditable`: Status is `draft` or `rejected`

#### useRaidPermissions (NEW - TD-001)

**File:** `src/hooks/useRaidPermissions.js`

Provides RAID item permissions with status-based close/reopen logic.

```javascript
const {
  canView,
  canCreate,
  canEdit,
  canDelete,
  canClose,
  canReopen,
  isOpen,
  isClosed,
} = useRaidPermissions(raidItem);
```

**Key Logic:**
- `canClose`: Managers only, item must be open
- `canReopen`: Managers only, item must be closed
- `canDelete`: Supplier-side only

#### useNetworkStandardPermissions (NEW - TD-001)

**File:** `src/hooks/useNetworkStandardPermissions.js`

Simple permission hook for network standards (supplier-side management).

```javascript
const {
  canView,
  canCreate,
  canEdit,
  canDelete,
  canManage,
} = useNetworkStandardPermissions();
```

**Key Logic:**
- All management permissions restricted to supplier-side roles
- No object-level checks (entity-level only)

---

## 10. Custom Hooks

### 9.1 Form Hooks

#### useForm

Full-featured form management with validation:

```javascript
const {
  values,
  errors,
  touched,
  isSubmitting,
  isValid,
  isDirty,
  handleChange,
  handleBlur,
  handleSubmit,
  setValue,
  setMultipleValues,
  setError,
  validate,
  reset,
  getFieldProps,
} = useForm({
  initialValues: { name: '', email: '' },
  validationRules: {
    name: { required: true, minLength: 2 },
    email: { required: true, email: true }
  },
  onSubmit: async (values) => { /* submit */ }
});
```

#### useFormValidation

Standalone validation hook:

```javascript
const {
  errors,
  validate,
  validateField,
  clearErrors,
  setFieldError,
  getError,
  isValid,
} = useFormValidation();

// Validate all fields
if (validate(formData, rules)) {
  // Submit
}
```

### 9.2 Dashboard Hook

#### useDashboardLayout

Manages dashboard widget visibility and positioning:

```javascript
const {
  layout,
  loading,
  saving,
  lastSaved,
  updateVisibility,
  bulkUpdateVisibility,
  updateLayoutPositions,
  saveLayoutPositions,
  resetToDefault,
  isWidgetVisible,
  getGridLayout,
  getWidgetConfig,
} = useDashboardLayout(userId, projectId, role);
```

### 9.3 Metrics Hooks

Centralized metrics with automatic refresh:

```javascript
// All dashboard metrics
const { metrics, loading, error, refresh } = useDashboardMetrics();

// Individual metric categories
const { metrics, loading, error, refresh } = useMilestoneMetrics();
const { metrics, loading, error, refresh } = useDeliverableMetrics();
const { metrics, loading, error, refresh } = useKPIMetrics();
const { metrics, loading, error, refresh } = useQualityStandardMetrics();
const { metrics, loading, error, refresh } = useTimesheetMetrics();
const { metrics, loading, error, refresh } = useExpenseMetrics();
const { metrics, loading, error, refresh } = useBudgetMetrics();
```

### 9.4 Document Template Hooks

```javascript
// Fetch all templates
const { templates, loading, error, refresh } = useDocumentTemplates({
  templateType: 'variation_cr',
  activeOnly: true
});

// Fetch default template by type
const { template, loading, error } = useDefaultTemplate('variation_cr');

// Render documents
const { rendering, error, renderToHtml, renderToDocx, renderToPdf } = useDocumentRenderer();

// Combined CR document hook
const { 
  template, 
  html, 
  warnings, 
  loading, 
  rendering, 
  error, 
  generatePreview 
} = useCRDocument(variation, project);
```

### 9.5 Utility Hooks

#### useReadOnly

Checks if current page is read-only for the user's role:

```javascript
const { isReadOnly, canEdit, role } = useReadOnly();

if (isReadOnly) {
  return <ViewOnlyNotice />;
}
```

### 10.3 UI Utility Hooks

> **Added:** 6 January 2026

#### useResizableColumns

Manages resizable table columns with localStorage persistence.

**File:** `src/hooks/useResizableColumns.js`

**Purpose:** Provides drag-to-resize functionality for table columns with automatic persistence.

```javascript
const {
  columnWidths,      // Current width values { name: 200, type: 100, ... }
  getColumnStyle,    // Returns { width, minWidth } for column
  startResize,       // Start drag: startResize(e, columnKey)
  isResizing,        // True if currently dragging
  resetWidths        // Reset to defaults
} = useResizableColumns({
  storageKey: 'planning-column-widths',
  defaultWidths: {
    name: 250,
    type: 100,
    start: 110,
    end: 110,
    predecessors: 120,
    progress: 80,
    status: 100
  },
  minWidths: {
    name: 150,
    type: 80,
    start: 90,
    end: 90,
    predecessors: 80,
    progress: 60,
    status: 80
  }
});
```

**Usage in Table Headers:**

```jsx
<th style={getColumnStyle('name')}>
  Name
  <div
    className="column-resize-handle"
    onMouseDown={(e) => startResize(e, 'name')}
  />
</th>
```

**Features:**
- Drag handles appear on hover (right edge of column)
- Purple gradient visual feedback during drag
- Minimum widths enforced to prevent collapse
- Widths saved to localStorage on drag end
- Restored on component mount

**CSS Requirements:**

```css
.column-resize-handle {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 6px;
  cursor: col-resize;
  background: transparent;
  transition: background 0.15s;
}

.column-resize-handle:hover {
  background: linear-gradient(to right, 
    transparent, 
    rgba(139, 92, 246, 0.3), 
    rgba(139, 92, 246, 0.5)
  );
}
```

---

## 11. State Management Patterns

### 11.1 Context vs Local State

| Use Context When | Use Local State When |
|------------------|---------------------|
| Data needed by many components | Data only used by one component |
| Data persists across navigation | Data is transient |
| Data requires authentication | Data is UI-only (modals, forms) |
| Data is project-scoped | Data is component-specific |

### 11.2 Caching Strategy

**Service-Level Caching:**
- Metrics service caches computed results
- Cache cleared on data mutation
- Cache cleared on project switch

**Context-Level State:**
- Prefetched data stored in context
- Updated on relevant events
- Polling for certain data (notifications)

### 11.3 Error Handling

```javascript
// Context pattern
const [error, setError] = useState(null);

try {
  const data = await fetchData();
  setData(data);
  setError(null);
} catch (err) {
  console.error('Error:', err);
  setError(err.message || 'An error occurred');
}
```

### 11.4 Re-render Optimization

1. **useMemo for derived state:**
```javascript
const currentAssignment = useMemo(() => {
  return availableProjects.find(a => a.project_id === currentProjectId);
}, [currentProjectId, availableProjects]);
```

2. **useCallback for functions:**
```javascript
const switchProject = useCallback((projectId) => {
  setCurrentProjectId(projectId);
  localStorage.setItem(PROJECT_STORAGE_KEY, projectId);
}, []);
```

3. **Memoized context values:**
```javascript
const value = useMemo(() => ({
  currentProject,
  projectId,
  switchProject,
  // ...
}), [currentProject, projectId, switchProject, /* ... */]);
```

### 11.5 Persistence Patterns

| Data | Storage | Behavior |
|------|---------|----------|
| Project selection | localStorage | Persists across sessions |
| View As role | sessionStorage | Clears when browser closes |
| Chat history | localStorage | Limited to 50 messages |
| Dashboard layout | Supabase | Synced to database |
| Form state | Local state | Not persisted |

### 11.6 Role Resolution Flow (Updated v3.0)

```
┌─────────────────────────────────────────────────────────────┐
│                    Permission Check Flow (v3.0)              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Component calls usePermissions()                           │
│           ↓                                                 │
│  usePermissions() calls useViewAs()                         │
│           ↓                                                 │
│  useViewAs() computes actualRole:                           │
│           │                                                 │
│           ├── isSystemAdmin? → 'admin'                      │
│           ├── isOrgAdmin? → 'admin'                         │
│           ├── has projectRole? → projectRole                │
│           └── fallback → 'viewer'                           │
│           ↓                                                 │
│  effectiveRole = viewAsRole || actualRole                   │
│           ↓                                                 │
│  usePermissions() uses effectiveRole for all checks         │
│           ↓                                                 │
│  hasPermission(effectiveRole, entity, action)               │
│  checks PERMISSION_MATRIX                                   │
│           ↓                                                 │
│  Returns boolean permission result                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

> **Key Change:** The `isSystemAdmin` and `isOrgAdmin` checks happen BEFORE
> the project role check. This ensures org admins get admin permissions
> even if they have no explicit project assignment.

---

## 12. Page-Specific State Management

### 12.1 Team Members Page

**File:** `src/pages/TeamMembers.jsx`  
**Version:** 3.0 (Refactored from Users.jsx)  
**Updated:** 12 December 2025

#### Purpose

Manages project-scoped user membership. Shows only users assigned to the current project and manages their project-specific roles via `user_projects` table.

#### State Structure

```javascript
{
  // Core data
  users: Array,              // Team members from user_projects JOIN profiles
  resources: Array,          // Project resources for linking
  
  // UI state
  loading: boolean,
  userRole: string,          // Current user's role for permission checks
  currentUserId: string,     // Current user ID for self-identification
  
  // Role editing
  editingRoleId: string,     // user_projects.id being edited
  
  // Resource linking
  linkingId: string,         // User being linked to resource
  selectedResourceId: string,
  unlinkDialog: { isOpen, resourceId, resourceName },
  
  // Add team member modal
  showAddModal: boolean,
  availableUsers: Array,     // Users not in project
  selectedUserId: string,
  selectedRole: string,
  addingMember: boolean,
  
  // Remove team member
  removeDialog: { isOpen, member }
}
```

#### Data Flow

```
ProjectContext (currentProject)
        ↓
TeamMembers.fetchData()
        ↓
SELECT from user_projects
  JOIN profiles (for user info)
  WHERE project_id = currentProject.id
        ↓
Transform to flat structure:
{
  id: user_projects.id,
  user_id: profiles.id,
  full_name, email, role (from user_projects),
  is_test_user, created_at
}
        ↓
Filter test users if toggle off
        ↓
setUsers(teamMembers)
```

#### Key Operations

| Operation | Table Modified | Description |
|-----------|---------------|-------------|
| Add Team Member | INSERT user_projects | Links existing user to project with role |
| Remove Member | DELETE user_projects | Removes project access (account remains) |
| Change Role | UPDATE user_projects.role | Project-scoped role change |
| Link Resource | UPDATE resources.user_id | Associates resource with user |

#### Access Control

- **Visible to:** Admin, Supplier PM
- **Full edit access:** Admin, Supplier PM
- **Self-removal prevention:** Cannot remove yourself from project

---

### 12.2 System Users Page

**File:** `src/pages/admin/SystemUsers.jsx`  
**Version:** 1.0  
**Created:** 12 December 2025

#### Purpose

Admin-only page for system-wide user account management. Shows ALL user accounts regardless of project membership.

#### State Structure

```javascript
{
  // Core data
  users: Array,              // All profiles with project counts
  
  // UI state
  loading: boolean,
  userRole: string,          // Must be 'admin' to access
  
  // Create user form
  showCreateForm: boolean,
  creating: boolean,
  newUser: {
    email: string,
    password: string,
    full_name: string,
    role: string           // Global role for profiles.role
  }
}
```

#### Data Flow

```
AuthContext (verify admin role)
        ↓
SystemUsers.fetchData()
        ↓
SELECT from profiles
  WITH user_projects (
    JOIN projects for name/reference
  )
        ↓
Transform to:
{
  id, email, full_name,
  global_role: profiles.role,
  is_test_user, created_at,
  projects: [{ id, name, reference, role }]
}
        ↓
Filter test users if toggle off
        ↓
setUsers(systemUsers)
```

#### Key Operations

| Operation | Table Modified | Description |
|-----------|---------------|-------------|
| Create User | INSERT profiles (via API) | Creates new system account |
| Toggle Test User | UPDATE profiles.is_test_user | Marks user as test/real |

#### Access Control

- **Visible to:** Admin only
- **Non-admin redirect:** Automatically redirects to /dashboard
- **Route:** /admin/users

---

### 12.3 User Management Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    User Management Split                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  │
│  │   Team Members Page     │  │   System Users Page     │  │
│  │   /team-members         │  │   /admin/users          │  │
│  ├─────────────────────────┤  ├─────────────────────────┤  │
│  │ • Project-scoped        │  │ • System-wide           │  │
│  │ • Shows current project │  │ • Shows ALL accounts    │  │
│  │   members only          │  │                         │  │
│  │ • Role = user_projects  │  │ • Role = profiles       │  │
│  │ • Add/remove from       │  │ • Create new accounts   │  │
│  │   project               │  │ • View project counts   │  │
│  │ • Admin + Supplier PM   │  │ • Admin only            │  │
│  └─────────────────────────┘  └─────────────────────────┘  │
│                                                             │
│  Database Tables:                                           │
│  ┌─────────────────────────────────────────────────────────┤
│  │ profiles (global accounts) ◄──── SystemUsers reads     │  │
│  │     │                                                   │  │
│  │     │ 1:N                                               │  │
│  │     ↓                                                   │  │
│  │ user_projects (project membership) ◄── TeamMembers     │  │
│  │     │                                   manages        │  │
│  │     │ N:1                                               │  │
│  │     ↓                                                   │  │
│  │ projects (project definitions)                          │  │
│  └─────────────────────────────────────────────────────────┘
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 13. New UI Components (December 2025)

This section documents new components added as part of the multi-tenancy implementation.

### 13.1 Landing Page

**File:** `src/pages/LandingPage.jsx`

Public marketing page shown to unauthenticated visitors at `/`.

**Features:**
- Hero section with CTAs
- Features grid (6 feature cards)
- Benefits list
- CTA section
- Responsive footer

**Routing Logic:**
```jsx
// In App.jsx
function PublicHomeRoute({ children }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <LoadingSpinner />;
  if (user) return <Navigate to="/dashboard" replace />;
  
  return <Suspense fallback={...}>{children}</Suspense>;
}

// Route
<Route path="/" element={
  <PublicHomeRoute><LandingPage /></PublicHomeRoute>
} />
```

**Key Links:**
| Link | Destination |
|------|-------------|
| Sign Up | `/login?mode=signup` |
| Login | `/login` |

---

### 13.2 Onboarding Components

**Location:** `src/components/onboarding/`

#### OnboardingWizard.jsx

Main wizard component managing 4-step onboarding flow.

**State:**
```javascript
const [currentStep, setCurrentStep] = useState(1);
const [wizardData, setWizardData] = useState({
  organisation: {},      // From Step 1
  invitations: [],       // From Step 2
  project: null,         // From Step 3
});
```

**Steps:**

| Step | Component | Purpose | Skippable |
|------|-----------|---------|-----------|
| 1 | Step1OrgDetails | Organisation name, display name | No |
| 2 | Step2InviteTeam | Invite up to 5 team members | Yes |
| 3 | Step3FirstProject | Create first project | Yes |
| 4 | Step4Complete | Success message, next steps | No |

**Completion Tracking:**
```javascript
// Updates organisations.settings.onboarding_completed
await organisationService.updateSettings(orgId, { 
  onboarding_completed: true 
});
```

#### Step Components

**Step1OrgDetails.jsx:**
- Updates organisation display_name if changed
- Validates name is not empty

**Step2InviteTeam.jsx:**
- Email input with add/remove
- Maximum 5 invitations
- Uses `invitationService.createInvitation()`
- Shows success/error per invitation

**Step3FirstProject.jsx:**
- Project name and reference
- Optional description
- Uses `createProjectAPI()` 
- Validates reference format

**Step4Complete.jsx:**
- Summary of what was created
- Links to dashboard, invite more, create project

---

### 13.3 Organisation Creation Page

**File:** `src/pages/onboarding/CreateOrganisation.jsx`

Shown when authenticated user has no organisations.

**Flow:**
```
User with no orgs → /onboarding/create-organisation → Create org → /onboarding/wizard
```

**Form Fields:**
- Organisation Name (required)
- Slug (auto-generated, editable)

**API Call:**
```javascript
const response = await fetch('/api/create-organisation', {
  method: 'POST',
  body: JSON.stringify({ name, slug, adminToken })
});
```

---

### 13.4 Invitation Components

**File:** `src/components/organisation/PendingInvitationCard.jsx`

Displays pending invitation with actions.

**Props:**
```typescript
interface PendingInvitationCardProps {
  invitation: {
    id: string;
    email: string;
    org_role: string;
    expires_at: string;
    created_at: string;
  };
  onResend: (id: string) => void;
  onRevoke: (id: string) => void;
  onCopyLink: (token: string) => void;
}
```

**Features:**
- Email and role display
- Expiry countdown (e.g., "Expires in 5 days")
- Expired badge when past expiry
- Action buttons: Resend, Copy Link, Revoke

**Expiry Logic:**
```javascript
const getExpiryText = (expiresAt) => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'Expired';
  if (diffDays === 0) return 'Expires today';
  if (diffDays === 1) return 'Expires tomorrow';
  return `Expires in ${diffDays} days`;
};
```

---

### 13.5 Subscription UI Components

**Location:** `src/components/common/`

#### UpgradePrompt.jsx

Displays upgrade prompts when approaching or exceeding limits.

**Variants:**
| Variant | Use Case |
|---------|----------|
| `banner` | Full-width banner at top of page |
| `modal` | Centered modal with comparison |
| `card` | Card layout in settings/dashboard |
| `inline` | Compact inline display |

**Props:**
```typescript
interface UpgradePromptProps {
  limitType: 'members' | 'projects' | 'storage';
  current: number;
  limit: number;
  tier: string;
  variant: 'banner' | 'modal' | 'card' | 'inline';
  onUpgrade?: () => void;
  onDismiss?: () => void;
}
```

**Status Levels:**
```javascript
const getStatus = (current, limit) => {
  const percentage = (current / limit) * 100;
  if (percentage >= 100) return 'exceeded';
  if (percentage >= 90) return 'critical';
  if (percentage >= 75) return 'warning';
  return 'normal';
};
```

#### UsageMeter.jsx

Visual progress bar showing usage vs limit.

**Props:**
```typescript
interface UsageMeterProps {
  type: 'members' | 'projects' | 'storage';
  current: number;
  limit: number;          // Can be Infinity
  label?: string;
  showIcon?: boolean;
  showLabel?: boolean;
  showValues?: boolean;
  size?: 'small' | 'default' | 'large';
}
```

**Handling Unlimited:**
```javascript
// When limit is Infinity, show just the count
if (limit === Infinity) {
  return <span>{current} (unlimited)</span>;
}
```

**Exported Components:**
- `UsageMeter` - Full meter with bar
- `UsageInline` - Compact "X / Y" display
- `UsageSummaryCard` - Dashboard card with multiple meters

---

### 13.6 Dashboard Widgets

**File:** `src/components/dashboard/OrganisationUsageWidget.jsx`

Shows organisation stats for org admins on dashboard.

**Visibility:**
- Only shown to users with `isOrgAdmin` role
- Displays in dashboard grid

**Current Implementation (Free Tier Unlimited):**
```jsx
// Simplified to show counts only (no limits)
<div className="org-usage-widget">
  <h3>{organisation.display_name || organisation.name}</h3>
  <div className="stats">
    <div className="stat">
      <Users size={20} />
      <span>{memberCount} members</span>
    </div>
    <div className="stat">
      <FolderKanban size={20} />
      <span>{projectCount} projects</span>
    </div>
  </div>
</div>
```

**Future Implementation (With Paid Tiers):**
When paid tiers are enabled, this widget will show:
- Usage meters for members/projects
- Tier badge
- Upgrade button (links to /admin/billing)

---

### 13.7 File Structure Summary

```
src/
├── pages/
│   ├── LandingPage.jsx           # Public landing page
│   ├── LandingPage.css
│   └── onboarding/
│       ├── CreateOrganisation.jsx
│       ├── CreateOrganisation.css
│       ├── OnboardingWizardPage.jsx
│       └── index.js
│
├── components/
│   ├── onboarding/
│   │   ├── OnboardingWizard.jsx
│   │   ├── OnboardingWizard.css
│   │   ├── Step1OrgDetails.jsx
│   │   ├── Step2InviteTeam.jsx
│   │   ├── Step3FirstProject.jsx
│   │   ├── Step4Complete.jsx
│   │   └── index.js
│   │
│   ├── organisation/
│   │   ├── PendingInvitationCard.jsx
│   │   ├── PendingInvitationCard.css
│   │   └── index.js
│   │
│   ├── common/
│   │   ├── UpgradePrompt.jsx
│   │   ├── UpgradePrompt.css
│   │   ├── UsageMeter.jsx
│   │   ├── UsageMeter.css
│   │   └── index.js (updated exports)
│   │
│   └── dashboard/
│       ├── OrganisationUsageWidget.jsx
│       ├── OrganisationUsageWidget.css
│       └── index.js (updated exports)
│
└── lib/
    └── subscriptionTiers.js      # Tier definitions
```

---

## 15. Evaluator Frontend

> **Added:** 7 January 2026
> 
> **Reference:** See **TECH-SPEC-11-Evaluator.md** for comprehensive documentation of the Evaluator module.

The Evaluator module provides vendor evaluation and selection capabilities. This section provides a summary with references to the detailed documentation.

### 15.1 Overview

**Location:** `src/pages/evaluator/`

The Evaluator module consists of 15 pages for managing evaluation projects, requirements, vendors, workshops, surveys, scoring, and report generation.

### 15.2 Evaluator Pages Summary

| Page | File | Purpose |
|------|------|---------|
| EvaluatorDashboard | `EvaluatorDashboard.jsx` | Main dashboard showing evaluation projects |
| EvaluationHub | `EvaluationHub.jsx` | Central hub for evaluation project management |
| RequirementsHub | `RequirementsHub.jsx` | Manage evaluation requirements by category |
| RequirementDetail | `RequirementDetail.jsx` | Individual requirement detail view |
| VendorsHub | `VendorsHub.jsx` | Manage vendors in evaluation |
| VendorDetail | `VendorDetail.jsx` | Individual vendor detail and scoring |
| WorkshopsHub | `WorkshopsHub.jsx` | Manage vendor workshops/demos |
| WorkshopDetail | `WorkshopDetail.jsx` | Individual workshop management |
| QuestionsHub | `QuestionsHub.jsx` | Manage vendor questions/RFI |
| DocumentsHub | `DocumentsHub.jsx` | Manage evaluation documents |
| ReportsHub | `ReportsHub.jsx` | Generate evaluation reports |
| TraceabilityView | `TraceabilityView.jsx` | Requirements traceability matrix |
| EvaluationSettings | `EvaluationSettings.jsx` | Evaluation project settings |
| ClientPortal | `ClientPortal.jsx` | External client portal access |
| VendorPortal | `VendorPortal.jsx` | External vendor portal access |

### 15.3 State Management

The Evaluator module uses two dedicated contexts:

| Context | Location | Purpose |
|---------|----------|---------|
| EvaluationContext | `src/contexts/EvaluationContext.jsx` | Manages current evaluation state |
| ReportBuilderContext | `src/contexts/ReportBuilderContext.jsx` | Manages report builder state |

> **Reference:** See **Section 8.6** and **Section 8.7** for context details, and **TECH-SPEC-11-Evaluator.md Section 4** for comprehensive documentation.

### 15.4 Services

The module uses 18 dedicated services in `src/services/evaluator/`:

- ai.service.js, approvals.service.js, base.evaluator.service.js
- clientPortal.service.js, comments.service.js, emailNotifications.service.js
- evaluationCategories.service.js, evaluationDocuments.service.js, evaluationProjects.service.js
- evidence.service.js, requirements.service.js, scores.service.js
- stakeholderAreas.service.js, surveys.service.js, traceability.service.js
- vendorQuestions.service.js, vendors.service.js, workshops.service.js

> **Reference:** See **TECH-SPEC-11-Evaluator.md Section 5** for service documentation and **TECH-SPEC-08-Services.md** for integration details.

### 15.5 API Endpoints

The module exposes 8 API endpoints in `api/evaluator/`:

| Endpoint | Purpose |
|----------|---------|
| `/api/evaluator/ai-document-parse` | Parse uploaded documents with AI |
| `/api/evaluator/ai-gap-analysis` | AI gap analysis for requirements |
| `/api/evaluator/ai-market-research` | AI market research for vendors |
| `/api/evaluator/ai-requirement-suggest` | AI requirement suggestions |
| `/api/evaluator/client-portal-auth` | Client portal authentication |
| `/api/evaluator/create-evaluation` | Create new evaluation project |
| `/api/evaluator/generate-report` | Generate evaluation report |
| `/api/evaluator/vendor-portal-auth` | Vendor portal authentication |

> **Reference:** See **TECH-SPEC-11-Evaluator.md Section 6** for endpoint documentation and **TECH-SPEC-06-API-AI.md Section 10** for API integration.

---

## Appendix A: Role Display Configuration

```javascript
// Project Roles
export const ROLE_CONFIG = {
  admin: { label: 'Admin', color: '#7c3aed', bg: '#f3e8ff' },
  supplier_pm: { label: 'Supplier PM', color: '#059669', bg: '#d1fae5' },
  supplier_finance: { label: 'Supplier Finance', color: '#0d9488', bg: '#ccfbf1' },
  customer_pm: { label: 'Customer PM', color: '#d97706', bg: '#fef3c7' },
  customer_finance: { label: 'Customer Finance', color: '#ea580c', bg: '#ffedd5' },
  contributor: { label: 'Contributor', color: '#2563eb', bg: '#dbeafe' },
  viewer: { label: 'Viewer', color: '#64748b', bg: '#f1f5f9' },
};

// Organisation Roles (NEW - December 2025)
export const ORG_ROLE_CONFIG = {
  org_owner: { label: 'Owner', color: '#7c3aed', bg: '#f3e8ff' },
  org_admin: { label: 'Admin', color: '#059669', bg: '#d1fae5' },
  org_member: { label: 'Member', color: '#64748b', bg: '#f1f5f9' },
};
```

---

## Appendix B: Context Import Patterns

```javascript
// Contexts
import { useAuth } from '../contexts/AuthContext';
import { useOrganisation } from '../contexts/OrganisationContext';  // NEW
import { useProject } from '../contexts/ProjectContext';
import { useViewAs } from '../contexts/ViewAsContext';
import { useChat } from '../contexts/ChatContext';
import { useMetrics } from '../contexts/MetricsContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useToast } from '../contexts/ToastContext';
import { useHelp } from '../contexts/HelpContext';
import { useTestUsers } from '../contexts/TestUserContext';

// Hooks (via barrel export)
import { 
  usePermissions,
  useForm,
  useDashboardLayout,
  useMilestonePermissions,
  useDeliverablePermissions,
  useTimesheetPermissions,
  useResourcePermissions,
  useExpensePermissions,        // NEW - TD-001
  useRaidPermissions,           // NEW - TD-001
  useNetworkStandardPermissions, // NEW - TD-001
  useDashboardMetrics,
  useMilestoneMetrics,
  useDeliverableMetrics,
  useDocumentTemplates,
  useReadOnly,
} from '../hooks';

// Permission utilities
import { 
  ROLES, 
  hasPermission, 
  canEditDeliverable,
  PERMISSION_MATRIX 
} from '../lib/permissions';
```

---

*Document generated as part of AMSF001 Technical Specification - Session 1.7*

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|--------|
| 1.0 | 11 Dec 2025 | Claude AI | Initial creation |
| 1.1 | 12 Dec 2025 | Claude AI | Added TestUserContext, ViewAs updates |
| 2.0 | 23 Dec 2025 | Claude AI | **Organisation Multi-Tenancy**: Added OrganisationContext (Section 4), OrganisationSwitcher component, updated Provider Hierarchy, updated ProjectContext to depend on OrganisationContext, added ORG_ROLE_CONFIG |
| 3.0 | 24 Dec 2025 | Claude AI | **Permission Hierarchy Fix**: Updated ViewAsContext v3.0 (org admin hierarchy), usePermissions v5.0 (isOrgLevelAdmin), updated Role Resolution Flow |
| 4.0 | 24 Dec 2025 | Claude AI | **New UI Components**: Added Section 13 documenting LandingPage, OnboardingWizard, PendingInvitationCard, UpgradePrompt, UsageMeter, OrganisationUsageWidget |
| 5.0 | 28 Dec 2025 | Claude AI | **Planning & Estimator Tools**: Added Section 14 documenting Planning.jsx, Estimator.jsx, Benchmarking.jsx pages and PlanningAIAssistant, ResourceTypeSelector components |
| 5.1 | 28 Dec 2025 | Claude AI | **TD-001 Permission Hook Consolidation**: Updated Section 9.4 with 3 new hooks (useExpensePermissions, useRaidPermissions, useNetworkStandardPermissions), added Hook Summary Table |
| 5.2 | 6 Jan 2026 | Claude AI | **UI Utility Hooks**: Added Section 10.3 documenting useResizableColumns hook, localStorage persistence patterns |
| 5.3 | 7 Jan 2026 | Claude AI | **Evaluator Module Reference**: Added Section 8.6 (EvaluationContext), Section 8.7 (ReportBuilderContext), Section 15 (Evaluator Frontend summary). Cross-references to TECH-SPEC-11-Evaluator.md |
| 5.4 | 15 Jan 2026 | Claude AI | **PlannerGrid Component**: Added Section 14.1a documenting AG Grid Enterprise component with selection sync, checkbox column, date synchronization, and table-style appearance |
