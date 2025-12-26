# Planning AI Assistant - Implementation Plan

## Overview

Add a conversational AI assistant to the Planning tool that allows users to describe project structures in natural language and have the AI generate milestones, deliverables, and tasks automatically.

---

## Verified Codebase Facts

### 1. Existing AI Infrastructure ✅

| Component | Location | Purpose |
|-----------|----------|---------|
| `api/report-ai.js` | Vercel Edge Function | Claude API with tool calling for Report Builder |
| `api/chat.js` | Vercel Edge Function | General chat with database queries (1,925 lines) |
| `ChatWidget.jsx` | `src/components/chat/` | Floating chat UI with streaming support |
| `ReportAIAssistant.jsx` | `src/components/reports/` | Embedded AI panel with action cards |
| `ChatContext.jsx` | `src/contexts/` | Global chat state management |

**API Pattern Used:**
```javascript
// api/report-ai.js
export const config = { runtime: 'edge' };
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = 'claude-sonnet-4-5-20250929';

// Uses tool calling pattern:
const TOOLS = [
  { name: "suggestSections", description: "...", input_schema: {...} },
  { name: "addSection", ... }
];
```

### 2. Plan Items Schema ✅

**Table:** `plan_items` (from `202512251900_create_plan_items.sql`)

```sql
CREATE TABLE plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  parent_id UUID REFERENCES plan_items(id),  -- For hierarchy
  
  item_type TEXT NOT NULL DEFAULT 'task' 
    CHECK (item_type IN ('task', 'milestone', 'deliverable')),
  
  name TEXT NOT NULL,
  description TEXT,
  
  start_date DATE,
  end_date DATE,
  duration_days INTEGER,
  
  progress INTEGER DEFAULT 0,
  status TEXT DEFAULT 'not_started',
  
  sort_order INTEGER DEFAULT 0,
  wbs TEXT,                    -- Work breakdown structure
  indent_level INTEGER DEFAULT 0,
  
  milestone_id UUID,           -- Link to existing milestone
  deliverable_id UUID,         -- Link to existing deliverable
  assigned_resource_id UUID,
  
  created_at, updated_at, created_by, is_deleted
);
```

### 3. Plan Items Service ✅

**File:** `src/services/planItemsService.js` (231 lines)

```javascript
// Available methods:
planItemsService.getAll(projectId)           // Returns all items
planItemsService.create(item)                // Creates single item (auto sort_order)
planItemsService.update(id, updates)         // Updates single item
planItemsService.delete(id)                  // Soft delete
planItemsService.reorder(items)              // Bulk update sort_order
planItemsService.indent(id, parentId)        // Set parent
planItemsService.outdent(id)                 // Remove parent
planItemsService.linkToMilestone(id, milestoneId)
planItemsService.linkToDeliverable(id, deliverableId)
```

**Note:** No batch create method exists - will need to create items sequentially or add a batch method.

### 4. Planning Page State ✅

**File:** `src/pages/planning/Planning.jsx` (641 lines)

```javascript
const [items, setItems] = useState([]);
const { projectId } = useProject();

async function fetchItems() {
  const data = await planItemsService.getAll(projectId);
  setItems(data);
}

// Refresh button already exists:
<button onClick={fetchItems} className="plan-btn plan-btn-secondary">
  <RefreshCw size={16} /> Refresh
</button>
```

### 5. ANTHROPIC_API_KEY ✅

Already configured in Vercel environment variables (used by existing chat.js and report-ai.js).

---

## Implementation Plan

### Phase 1: API Endpoint (api/planning-ai.js)

**Effort:** 2-3 hours

Create a new Vercel Edge Function following the `report-ai.js` pattern.

```javascript
// api/planning-ai.js
export const config = { runtime: 'edge' };

const TOOLS = [
  {
    name: "generateProjectStructure",
    description: "Generate milestones, deliverables, and tasks from a project description",
    input_schema: {
      type: "object",
      properties: {
        structure: {
          type: "array",
          items: {
            type: "object",
            properties: {
              item_type: { enum: ["milestone", "deliverable", "task"] },
              name: { type: "string" },
              description: { type: "string" },
              duration_days: { type: "integer" },
              children: { type: "array" }  // Nested items
            }
          }
        },
        startDate: { type: "string", format: "date" },
        reasoning: { type: "string" }
      }
    }
  },
  {
    name: "refineStructure",
    description: "Modify existing structure based on user feedback",
    input_schema: {...}
  }
];
```

**System Prompt:**
```
You are a project planning assistant. Convert natural language project 
descriptions into structured plans with:
- Milestones (major phases/checkpoints)
- Deliverables (tangible outputs under milestones)  
- Tasks (work items under deliverables)

Calculate dates based on duration and start date. Maintain proper hierarchy.
Ask clarifying questions if the description is vague.
```

### Phase 2: UI Component (PlanningAIAssistant.jsx)

**Effort:** 3-4 hours

Based on `ReportAIAssistant.jsx` pattern (578 lines), create:

```
src/pages/planning/
├── Planning.jsx          (existing - add toggle button)
├── Planning.css          (existing - add panel styles)
├── PlanningAIAssistant.jsx   (NEW - ~400 lines)
└── PlanningAIAssistant.css   (NEW - ~300 lines)
```

**Component Structure:**
```jsx
export default function PlanningAIAssistant({ 
  onClose, 
  onApplyStructure,  // Callback to add items to Planning grid
  projectId 
}) {
  const [messages, setMessages] = useState([]);
  const [pendingStructure, setPendingStructure] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Quick prompts
  const QUICK_PROMPTS = [
    { label: "Software project", prompt: "Help me plan a software development project" },
    { label: "Marketing campaign", prompt: "Help me plan a marketing campaign" },
    { label: "Product launch", prompt: "Help me plan a product launch" }
  ];
  
  return (
    <div className="planning-ai-panel">
      <Header onClose={onClose} />
      <QuickPrompts prompts={QUICK_PROMPTS} onSelect={sendMessage} />
      <MessageList messages={messages} />
      {pendingStructure && (
        <StructurePreview 
          structure={pendingStructure}
          onApply={handleApply}
          onRefine={handleRefine}
        />
      )}
      <InputArea onSend={sendMessage} isLoading={isLoading} />
    </div>
  );
}
```

### Phase 3: Structure Preview Component

**Effort:** 2 hours

Visual tree showing what will be created:

```jsx
function StructurePreview({ structure, onApply, onRefine }) {
  return (
    <div className="ai-structure-preview">
      <h4>Generated Structure</h4>
      <div className="structure-tree">
        {structure.map(item => (
          <TreeItem key={item.name} item={item} />
        ))}
      </div>
      <div className="structure-actions">
        <button onClick={onRefine}>Refine</button>
        <button onClick={onApply} className="primary">
          Apply to Planning ({countItems(structure)} items)
        </button>
      </div>
    </div>
  );
}

function TreeItem({ item, depth = 0 }) {
  const icon = item.item_type === 'milestone' ? '🚩' 
             : item.item_type === 'deliverable' ? '📦' 
             : '☑️';
  return (
    <>
      <div style={{ paddingLeft: depth * 20 }}>
        {icon} {item.name}
        {item.duration_days && <span className="duration">({item.duration_days}d)</span>}
      </div>
      {item.children?.map(child => (
        <TreeItem key={child.name} item={child} depth={depth + 1} />
      ))}
    </>
  );
}
```

### Phase 4: Apply Logic (Batch Create)

**Effort:** 1-2 hours

Add batch create to `planItemsService.js`:

```javascript
/**
 * Create multiple plan items maintaining hierarchy
 * @param {Array} items - Flat array with parent references
 */
async createBatch(projectId, items) {
  const idMap = {};  // temp_id -> real_id
  const results = [];
  
  for (const item of items) {
    const parentId = item.temp_parent_id 
      ? idMap[item.temp_parent_id] 
      : null;
    
    const created = await this.create({
      project_id: projectId,
      parent_id: parentId,
      item_type: item.item_type,
      name: item.name,
      description: item.description,
      start_date: item.start_date,
      end_date: item.end_date,
      duration_days: item.duration_days,
      indent_level: item.indent_level || 0
    });
    
    idMap[item.temp_id] = created.id;
    results.push(created);
  }
  
  return results;
}
```

### Phase 5: Integration with Planning.jsx

**Effort:** 1 hour

```jsx
// Add to Planning.jsx
import PlanningAIAssistant from './PlanningAIAssistant';

export default function Planning() {
  const [showAIPanel, setShowAIPanel] = useState(false);
  
  const handleApplyStructure = async (structure) => {
    try {
      await planItemsService.createBatch(projectId, flattenStructure(structure));
      fetchItems();  // Refresh grid
      setShowAIPanel(false);
      toast.success(`Created ${countItems(structure)} items`);
    } catch (error) {
      toast.error('Failed to create items');
    }
  };
  
  return (
    <div className={`planning-page ${showAIPanel ? 'with-ai-panel' : ''}`}>
      {/* Existing content */}
      <button onClick={() => setShowAIPanel(true)}>
        <Sparkles /> AI Assistant
      </button>
      
      {showAIPanel && (
        <PlanningAIAssistant
          onClose={() => setShowAIPanel(false)}
          onApplyStructure={handleApplyStructure}
          projectId={projectId}
        />
      )}
    </div>
  );
}
```

---

## File Changes Summary

| File | Action | Lines Est. |
|------|--------|------------|
| `api/planning-ai.js` | CREATE | ~400 |
| `src/pages/planning/PlanningAIAssistant.jsx` | CREATE | ~400 |
| `src/pages/planning/PlanningAIAssistant.css` | CREATE | ~300 |
| `src/services/planItemsService.js` | MODIFY | +50 (batch create) |
| `src/pages/planning/Planning.jsx` | MODIFY | +30 (integration) |
| `src/pages/planning/Planning.css` | MODIFY | +50 (layout) |

**Total New Code:** ~1,230 lines

---

## Effort Estimate

| Phase | Task | Hours |
|-------|------|-------|
| 1 | API Endpoint (planning-ai.js) | 2-3 |
| 2 | UI Component (PlanningAIAssistant.jsx) | 3-4 |
| 3 | Structure Preview Component | 2 |
| 4 | Batch Create Service Method | 1-2 |
| 5 | Integration & Testing | 2 |
| | **Total** | **10-13 hours** |

---

## Example User Flow

```
User: "I'm building a mobile app. We have 3 phases: design (2 weeks), 
       development (8 weeks), and launch (2 weeks). Design includes 
       UX research and UI design. Development has frontend and backend. 
       Launch includes beta testing and app store submission."

AI: "I've created a structure for your mobile app project:

     🚩 Phase 1: Design (2 weeks, Jan 1 - Jan 14)
        📦 UX Research (1 week)
           ☑️ User interviews
           ☑️ Competitor analysis
           ☑️ User personas
        📦 UI Design (1 week)
           ☑️ Wireframes
           ☑️ High-fidelity mockups
           ☑️ Design review
     
     🚩 Phase 2: Development (8 weeks, Jan 15 - Mar 11)
        📦 Frontend Development (4 weeks)
           ☑️ Component library setup
           ☑️ Screen implementation
           ☑️ API integration
        📦 Backend Development (4 weeks)
           ☑️ API development
           ☑️ Database setup
           ☑️ Authentication
     
     🚩 Phase 3: Launch (2 weeks, Mar 12 - Mar 25)
        📦 Beta Testing (1 week)
           ☑️ Internal testing
           ☑️ Beta user feedback
           ☑️ Bug fixes
        📦 App Store Submission (1 week)
           ☑️ Store listing preparation
           ☑️ Submission
           ☑️ Launch announcement

     [Apply to Planning (23 items)]  [Refine]"

User: "Add more detail to the backend development"

AI: "Updated Backend Development:
     
     📦 Backend Development (4 weeks)
        ☑️ API architecture design
        ☑️ User authentication & authorization
        ☑️ Core API endpoints
        ☑️ Database schema design
        ☑️ Data migration scripts
        ☑️ Third-party integrations
        ☑️ API documentation
        ☑️ Performance optimization
        ☑️ Security audit
     
     [Apply to Planning (30 items)]  [Refine]"
```

---

## Risk Considerations

1. **API Costs:** Claude Sonnet usage - mitigate by caching common structures
2. **Hierarchy Complexity:** Deeply nested structures - limit to 3 levels
3. **Date Calculation:** Overlapping/parallel tasks - clarify with user
4. **Existing Items:** Conflict with existing plan items - option to clear first or append

---

## Next Steps

1. **Approve plan** - Confirm approach and priorities
2. **Phase 1** - Build API endpoint with tool calling
3. **Phase 2** - Build UI component
4. **Test** - Verify end-to-end flow
5. **Iterate** - Refine based on feedback

---

*Document created: 26 December 2025*
*Based on codebase analysis of amsf001-project-tracker*
