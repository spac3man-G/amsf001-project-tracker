/**
 * Planning AI Assistant - Vercel Serverless Function
 * 
 * Converts natural language project descriptions into structured plans
 * with milestones, deliverables, and tasks.
 * 
 * Features:
 * - Project structure generation from description
 * - Document analysis (PDF, images) for plan extraction
 * - Structure refinement based on feedback
 * - Date calculation from durations
 * - Hierarchy management (milestone → deliverable → task)
 * 
 * @version 1.3
 * @created 26 December 2025
 * @updated 05 January 2026 - Added enhanced logging for debugging
 */

export const config = {
  maxDuration: 120, // 120 seconds for document processing (Vercel Pro)
};

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = 'claude-sonnet-4-5-20250929';

// Token costs for monitoring (per 1M tokens)
const TOKEN_COSTS = {
  input: 3.00,
  output: 15.00,
};

// ============================================
// TOOL DEFINITIONS
// ============================================

const TOOLS = [
  {
    name: "generateProjectStructure",
    description: "Generate a hierarchical project structure with components, milestones, deliverables, and tasks from a project description. Use this when the user describes a new project or wants to create a plan from scratch. Use components to group related work (e.g., different sites, modules, or logical groupings).",
    input_schema: {
      type: "object",
      properties: {
        structure: {
          type: "array",
          description: "Hierarchical array of project items. Components and milestones at top level, milestones under components, deliverables under milestones, tasks under deliverables.",
          items: {
            type: "object",
            properties: {
              item_type: {
                type: "string",
                enum: ["component", "milestone", "deliverable", "task"],
                description: "Type of item: component (organizational grouping), milestone (phase/checkpoint), deliverable (tangible output), task (work item)"
              },
              name: {
                type: "string",
                description: "Clear, concise name for the item"
              },
              description: {
                type: "string",
                description: "Brief description of what this item involves"
              },
              duration_days: {
                type: "integer",
                description: "Estimated duration in working days"
              },
              children: {
                type: "array",
                description: "Nested child items (milestones under components, deliverables under milestones, tasks under deliverables)",
                items: {
                  type: "object",
                  properties: {
                    item_type: { type: "string", enum: ["component", "milestone", "deliverable", "task"] },
                    name: { type: "string" },
                    description: { type: "string" },
                    duration_days: { type: "integer" },
                    children: { type: "array" }
                  },
                  required: ["item_type", "name"]
                }
              }
            },
            required: ["item_type", "name"]
          }
        },
        summary: {
          type: "string",
          description: "Brief summary of the generated structure for the user"
        },
        totalDurationDays: {
          type: "integer",
          description: "Total estimated project duration in working days"
        },
        itemCounts: {
          type: "object",
          properties: {
            components: { type: "integer" },
            milestones: { type: "integer" },
            deliverables: { type: "integer" },
            tasks: { type: "integer" }
          },
          description: "Count of each item type"
        }
      },
      required: ["structure", "summary", "itemCounts"]
    }
  },
  {
    name: "refineStructure",
    description: "Modify an existing project structure based on user feedback. Use this when the user wants to add detail, remove items, change durations, or otherwise adjust the structure.",
    input_schema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["add_detail", "remove_items", "modify_durations", "restructure", "add_items"],
          description: "Type of refinement being made"
        },
        targetArea: {
          type: "string",
          description: "Which part of the structure is being refined (e.g., 'Backend Development', 'Phase 2')"
        },
        structure: {
          type: "array",
          description: "The complete updated structure after refinement",
          items: {
            type: "object",
            properties: {
              item_type: { type: "string", enum: ["component", "milestone", "deliverable", "task"] },
              name: { type: "string" },
              description: { type: "string" },
              duration_days: { type: "integer" },
              children: { type: "array" }
            },
            required: ["item_type", "name"]
          }
        },
        changesSummary: {
          type: "string",
          description: "Summary of what was changed"
        },
        itemCounts: {
          type: "object",
          properties: {
            components: { type: "integer" },
            milestones: { type: "integer" },
            deliverables: { type: "integer" },
            tasks: { type: "integer" }
          }
        }
      },
      required: ["action", "structure", "changesSummary", "itemCounts"]
    }
  },
  {
    name: "editPlanItems",
    description: "Make specific edits to existing plan items. Use this when the user wants to add, remove, rename, copy, or modify specific items in their current plan. This is for editing the EXISTING plan, not generating a new structure.",
    input_schema: {
      type: "object",
      properties: {
        operations: {
          type: "array",
          description: "List of edit operations to perform",
          items: {
            type: "object",
            properties: {
              operation: {
                type: "string",
                enum: ["add", "remove", "rename", "update", "copy", "move"],
                description: "Type of operation"
              },
              targetId: {
                type: "string",
                description: "ID of the item to modify (for remove, rename, update, copy, move)"
              },
              targetName: {
                type: "string",
                description: "Name of the item to modify (alternative to targetId when ID is unknown)"
              },
              parentId: {
                type: "string",
                description: "ID of parent item (for add operation)"
              },
              parentName: {
                type: "string",
                description: "Name of parent item (alternative to parentId)"
              },
              newValues: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  item_type: { type: "string", enum: ["component", "milestone", "deliverable", "task"] },
                  start_date: { type: "string" },
                  end_date: { type: "string" },
                  duration_days: { type: "integer" },
                  status: { type: "string", enum: ["not_started", "in_progress", "completed", "on_hold", "cancelled"] },
                  progress: { type: "integer" }
                },
                description: "New values for add, rename, or update operations"
              },
              destinationParentId: {
                type: "string",
                description: "Destination parent ID for move/copy operations"
              },
              destinationParentName: {
                type: "string",
                description: "Destination parent name for move/copy operations"
              }
            },
            required: ["operation"]
          }
        },
        summary: {
          type: "string",
          description: "Human-readable summary of the changes being made"
        }
      },
      required: ["operations", "summary"]
    }
  },
  {
    name: "askClarification",
    description: "Ask the user for more information when the project description is too vague or missing critical details.",
    input_schema: {
      type: "object",
      properties: {
        questions: {
          type: "array",
          items: { type: "string" },
          description: "List of clarifying questions to ask the user"
        },
        reason: {
          type: "string",
          description: "Why these questions are needed"
        }
      },
      required: ["questions", "reason"]
    }
  }
];

// ============================================
// SYSTEM PROMPT
// ============================================

const SYSTEM_PROMPT = `You are a project planning assistant integrated into a project management tool. Your role is to help users convert natural language project descriptions into structured work breakdown structures, AND to help them edit and manage their existing plans through natural conversation.

## Your Capabilities

1. **Generate Project Structures**: Convert project descriptions into hierarchical plans with:
   - **Components**: Organizational containers to group related work (e.g., "LRS Site", "VIC Site", "Backend Module")
   - **Milestones**: Major phases or checkpoints under components or at root (e.g., "Phase 1: Discovery", "MVP Launch")
   - **Deliverables**: Tangible outputs under milestones (e.g., "User Research Report", "API Documentation")
   - **Tasks**: Specific work items under deliverables (e.g., "Conduct user interviews", "Write endpoint specs")

2. **Edit Existing Plans**: Make changes to the user's current plan:
   - Add new items (components, milestones, deliverables, tasks)
   - Remove items
   - Rename items
   - Update properties (dates, status, progress, descriptions)
   - Copy items
   - Move items to different parents

3. **Refine Generated Structures**: Modify structures you've generated based on feedback

4. **Ask Clarifying Questions**: When descriptions are vague, ask targeted questions

## Guidelines

### Hierarchy Rules (IMPORTANT)
- Components can ONLY be at root level (organizational grouping, does NOT commit to Tracker)
- Milestones can be at root level OR under a Component
- Deliverables MUST be under a Milestone
- Tasks MUST be under a Deliverable OR another Task
- Maximum 4 levels: Component → Milestone → Deliverable → Task

### When to Use Components
Use components to organize work when:
- There are multiple sites, locations, or schools in the same project
- Work can be logically grouped (e.g., "Frontend", "Backend", "Infrastructure")
- The user wants to copy a structure for multiple instances
- The user explicitly asks for organizational grouping

Components are ORGANIZATIONAL ONLY - they help structure the plan but do NOT commit to the Tracker. Only milestones and deliverables commit to the Tracker for billing/tracking.

### When to Use Each Tool
- **generateProjectStructure**: For creating NEW plans from descriptions
- **editPlanItems**: For modifying EXISTING plan items (add, remove, rename, update, copy, move)
- **refineStructure**: For modifying a structure you just generated (before it's applied)
- **askClarification**: When you need more information

### Edit Operations
When using editPlanItems, you can identify items by either:
- Their ID (targetId) - most reliable
- Their name (targetName) - use when ID isn't available

Common edit patterns:
- "Add a task called X under deliverable Y" → add operation with parentName
- "Remove Phase 3" → remove operation with targetName
- "Rename milestone 1 to..." → rename operation
- "Copy Phase 1 and rename to Phase 2" → copy operation
- "Change the status of task X to completed" → update operation
- "Move task X under deliverable Y" → move operation

### Best Practices
- Be conversational and confirm what you're doing
- When editing, always summarize the changes made
- If unsure which item the user means, ask for clarification
- Preserve existing data when making edits

## CRITICAL: Always Use Tools
You MUST use one of the provided tools for every response. Do not respond with just text - always call a tool:
- If the user wants a plan created → use generateProjectStructure
- If the user wants to edit existing items → use editPlanItems
- If you need more information → use askClarification
- If the user wants to modify a generated structure → use refineStructure`;

// ============================================
// EXISTING PLAN CONTEXT ADDITION TO SYSTEM PROMPT
// ============================================

const EXISTING_PLAN_PROMPT = `

## Current Plan Items

The user has an existing project plan. Here are the current items:

\`\`\`json
{existingItems}
\`\`\`

When the user asks to edit, add, remove, rename, or modify items, use the editPlanItems tool.
Reference items by their ID when possible, or by name if ID is not available.
Always confirm what changes you're making.`;

// ============================================
// DOCUMENT ANALYSIS ADDITIONS TO SYSTEM PROMPT
// ============================================

const DOCUMENT_ANALYSIS_PROMPT = `

## Document Analysis

You have been provided with a document (PDF or image). Analyze it thoroughly to:

1. **Identify Project Scope**: What is the project about? What are the main objectives?
2. **Extract Phases/Milestones**: Look for natural project phases, stages, or major checkpoints
3. **Find Deliverables**: Identify tangible outputs, documents, or products mentioned
4. **Discover Tasks**: Extract specific work items, activities, or action items
5. **Note Timelines**: If dates or durations are mentioned, incorporate them
6. **Capture Dependencies**: Note any mentioned dependencies or sequences

When generating a structure from a document:
- Be thorough but don't invent items not supported by the document
- Ask clarifying questions if the document is ambiguous about scope or timeline
- Group related items logically even if the document doesn't explicitly group them
- Use professional naming conventions for items you create

If the document is a:
- **Project Brief**: Extract objectives, scope, deliverables, and timeline
- **Requirements Document**: Create deliverables from requirement groups, tasks from individual requirements
- **Scope Document**: Map scope items to milestones and deliverables
- **Proposal**: Extract work packages, phases, and deliverables
- **Meeting Notes**: Identify action items and decisions that need planning

IMPORTANT: After analyzing the document, you MUST call the generateProjectStructure tool to create the plan. Do not respond with just text.`;

// ============================================
// DOCUMENT VALIDATION
// ============================================

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

// Only PDF is supported as a document type in the Claude API
// Other Office formats require the Analysis Tool which isn't available via API
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf'
];

// Image types supported
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
];

// All allowed types (for validation)
const ALL_ALLOWED_TYPES = [...ALLOWED_DOCUMENT_TYPES, ...ALLOWED_IMAGE_TYPES];

function validateDocument(document) {
  if (!document) return { valid: true }; // Document is optional
  
  if (!document.data || !document.mediaType) {
    return { valid: false, error: 'Document must include data and mediaType' };
  }
  
  if (!ALL_ALLOWED_TYPES.includes(document.mediaType)) {
    return { 
      valid: false, 
      error: `Unsupported file type: ${document.mediaType}. Currently supported: PDF and images (JPEG, PNG, WebP, GIF). Word, PowerPoint, and Excel files are not yet supported via the API.` 
    };
  }
  
  // Estimate size from base64 (base64 is ~33% larger than binary)
  const estimatedSize = (document.data.length * 3) / 4;
  if (estimatedSize > MAX_DOCUMENT_SIZE) {
    return { 
      valid: false, 
      error: `Document too large. Maximum size is 10MB.` 
    };
  }
  
  return { valid: true };
}

function buildMessageWithDocument(userMessage, document) {
  // If no document, return simple text message
  if (!document) {
    return { role: 'user', content: userMessage };
  }
  
  const content = [];
  
  // Add document first
  if (document.mediaType === 'application/pdf') {
    content.push({
      type: 'document',
      source: {
        type: 'base64',
        media_type: document.mediaType,
        data: document.data
      }
    });
  } else {
    // Image types
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: document.mediaType,
        data: document.data
      }
    });
  }
  
  // Add text message
  content.push({
    type: 'text',
    text: userMessage || 'Please analyze this document and suggest a project plan structure.'
  });
  
  return { role: 'user', content };
}

function buildMessageWithDocuments(userMessage, documents) {
  // If no documents, return simple text message
  if (!documents || documents.length === 0) {
    return { role: 'user', content: userMessage };
  }
  
  const content = [];
  
  // Add all documents first
  for (const doc of documents) {
    if (ALLOWED_DOCUMENT_TYPES.includes(doc.mediaType)) {
      // PDF - use document type
      content.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: doc.mediaType,
          data: doc.data
        }
      });
    } else if (ALLOWED_IMAGE_TYPES.includes(doc.mediaType)) {
      // Images - use image type
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: doc.mediaType,
          data: doc.data
        }
      });
    }
    // Skip unsupported types (they should be caught by validation)
  }
  
  // Add text message
  const defaultText = documents.length > 1 
    ? 'Please analyze these documents and suggest a project plan structure.'
    : 'Please analyze this document and suggest a project plan structure.';
  
  content.push({
    type: 'text',
    text: userMessage || defaultText
  });
  
  return { role: 'user', content };
}

// ============================================
// MAIN HANDLER
// ============================================

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check API key
  if (!ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY not configured');
    return res.status(500).json({ error: 'AI service not configured' });
  }

  try {
    const { messages, projectContext, currentStructure, document, documents, existingItems } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }

    // Support both single document and multiple documents
    const allDocuments = documents || (document ? [document] : []);
    
    // Validate all documents
    for (const doc of allDocuments) {
      const validation = validateDocument(doc);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
    }

    // Build context-aware system prompt
    let systemPrompt = SYSTEM_PROMPT;
    
    // Add document analysis prompt if documents are provided
    if (allDocuments.length > 0) {
      systemPrompt += DOCUMENT_ANALYSIS_PROMPT;
    }
    
    // Add existing plan items if provided
    if (existingItems && existingItems.length > 0) {
      // Simplify items for context (remove unnecessary fields)
      const simplifiedItems = existingItems.map(item => ({
        id: item.id,
        name: item.name,
        item_type: item.item_type,
        wbs: item.wbs,
        parent_id: item.parent_id,
        status: item.status,
        progress: item.progress,
        start_date: item.start_date,
        end_date: item.end_date
      }));
      systemPrompt += EXISTING_PLAN_PROMPT.replace('{existingItems}', JSON.stringify(simplifiedItems, null, 2));
    }
    
    if (projectContext) {
      systemPrompt += `\n\n## Current Project Context
- Project: ${projectContext.projectName || 'Unnamed Project'}
- Project ID: ${projectContext.projectId || 'N/A'}`;
    }

    if (currentStructure && currentStructure.length > 0) {
      systemPrompt += `\n\n## Current Structure
The user has an existing structure that they may want to refine:
\`\`\`json
${JSON.stringify(currentStructure, null, 2)}
\`\`\`

When the user asks to modify or add to this structure, use the refineStructure tool and include the complete updated structure.`;
    }

    // Process messages - attach documents to the last user message if provided
    let processedMessages = messages;
    if (allDocuments.length > 0 && messages.length > 0) {
      processedMessages = messages.map((msg, index) => {
        // Attach documents to the last user message
        if (index === messages.length - 1 && msg.role === 'user') {
          return buildMessageWithDocuments(msg.content, allDocuments);
        }
        return msg;
      });
    }

    // ============================================
    // ENHANCED LOGGING - REQUEST
    // ============================================
    console.log('='.repeat(60));
    console.log('PLANNING AI REQUEST');
    console.log('='.repeat(60));
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Documents: ${allDocuments.length}`);
    if (allDocuments.length > 0) {
      allDocuments.forEach((doc, i) => {
        console.log(`  Doc ${i + 1}: ${doc.filename || 'unnamed'} (${doc.mediaType}, ${Math.round((doc.data?.length || 0) * 3 / 4 / 1024)}KB)`);
      });
    }
    console.log(`Messages: ${messages.length}`);
    console.log(`Last user message: "${messages[messages.length - 1]?.content?.substring(0, 200)}..."`);
    console.log(`Has existing items: ${existingItems?.length || 0}`);
    console.log(`Has current structure: ${currentStructure?.length || 0}`);
    console.log('-'.repeat(60));

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8192, // Increased for complex project structures
        system: systemPrompt,
        tools: TOOLS,
        tool_choice: { type: "any" }, // Force tool use - don't allow text-only responses
        messages: processedMessages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('='.repeat(60));
      console.error('CLAUDE API ERROR');
      console.error('='.repeat(60));
      console.error(`Status: ${response.status}`);
      console.error(`Response: ${errorText}`);
      console.error('='.repeat(60));
      return res.status(500).json({ 
        error: 'AI service error',
        details: response.status 
      });
    }

    const data = await response.json();

    // ============================================
    // ENHANCED LOGGING - RESPONSE
    // ============================================
    console.log('='.repeat(60));
    console.log('CLAUDE API RESPONSE');
    console.log('='.repeat(60));
    console.log(`Stop reason: ${data.stop_reason}`);
    console.log(`Model: ${data.model}`);
    
    if (data.usage) {
      const cost = (data.usage.input_tokens * TOKEN_COSTS.input / 1000000) + 
                   (data.usage.output_tokens * TOKEN_COSTS.output / 1000000);
      console.log(`Tokens: ${data.usage.input_tokens} input, ${data.usage.output_tokens} output`);
      console.log(`Estimated cost: $${cost.toFixed(4)}`);
    }
    
    console.log(`Content blocks: ${data.content?.length || 0}`);
    
    if (data.content && data.content.length > 0) {
      data.content.forEach((block, i) => {
        console.log('-'.repeat(40));
        console.log(`Block ${i}: type=${block.type}`);
        
        if (block.type === 'text') {
          console.log(`Text content (first 500 chars): "${block.text?.substring(0, 500)}${block.text?.length > 500 ? '...' : ''}"`);
          console.log(`Text length: ${block.text?.length || 0} chars`);
        } else if (block.type === 'tool_use') {
          console.log(`Tool name: ${block.name}`);
          console.log(`Tool ID: ${block.id}`);
          
          // Log tool input details
          const input = block.input;
          if (input) {
            if (input.structure) {
              console.log(`Structure items: ${input.structure.length} top-level items`);
              // Count nested items
              let deliverables = 0, tasks = 0;
              const countNested = (items, depth = 0) => {
                for (const item of items) {
                  if (item.item_type === 'deliverable') deliverables++;
                  if (item.item_type === 'task') tasks++;
                  if (item.children) countNested(item.children, depth + 1);
                }
              };
              countNested(input.structure);
              console.log(`Nested counts: ${deliverables} deliverables, ${tasks} tasks`);
            }
            if (input.summary) {
              console.log(`Summary: "${input.summary.substring(0, 200)}${input.summary.length > 200 ? '...' : ''}"`);
            }
            if (input.itemCounts) {
              console.log(`Item counts: ${JSON.stringify(input.itemCounts)}`);
            }
            if (input.operations) {
              console.log(`Operations: ${input.operations.length} operations`);
              input.operations.forEach((op, j) => {
                console.log(`  Op ${j}: ${op.operation} - ${op.targetName || op.targetId || 'new item'}`);
              });
            }
            if (input.questions) {
              console.log(`Questions: ${input.questions.length} questions`);
              input.questions.forEach((q, j) => console.log(`  Q${j}: ${q}`));
            }
          }
        }
      });
    } else {
      console.log('WARNING: No content blocks in response!');
    }
    
    console.log('='.repeat(60));

    // Process response
    const result = processClaudeResponse(data);

    // ============================================
    // ENHANCED LOGGING - PROCESSED RESULT
    // ============================================
    console.log('PROCESSED RESULT');
    console.log('-'.repeat(40));
    console.log(`Action: ${result.action || 'none'}`);
    console.log(`Has message: ${!!result.message} (${result.message?.length || 0} chars)`);
    console.log(`Has structure: ${!!result.structure} (${result.structure?.length || 0} items)`);
    console.log(`Has operations: ${!!result.operations} (${result.operations?.length || 0} ops)`);
    console.log(`Clarification needed: ${result.clarificationNeeded}`);
    console.log(`Item counts: ${JSON.stringify(result.itemCounts)}`);
    
    if (!result.action && !result.message && !result.clarificationNeeded) {
      console.log('WARNING: Empty result - no action, message, or clarification!');
      console.log('Full data.content for debugging:');
      console.log(JSON.stringify(data.content, null, 2));
    }
    
    console.log('='.repeat(60));

    return res.status(200).json(result);

  } catch (error) {
    console.error('='.repeat(60));
    console.error('PLANNING AI EXCEPTION');
    console.error('='.repeat(60));
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    console.error('='.repeat(60));
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// ============================================
// RESPONSE PROCESSING
// ============================================

function processClaudeResponse(data) {
  const result = {
    message: '',
    structure: null,
    action: null,
    clarificationNeeded: false,
    questions: null,
    itemCounts: null,
    operations: null,
    stopReason: data.stop_reason
  };

  // Check if we have content
  if (!data.content || data.content.length === 0) {
    console.log('processClaudeResponse: No content blocks');
    result.message = 'I received your request but the AI returned an empty response. Please try again.';
    return result;
  }

  // Process content blocks
  for (const block of data.content) {
    if (block.type === 'text') {
      // Capture text content (might be used as fallback message)
      if (block.text) {
        result.message = block.text;
      }
    } else if (block.type === 'tool_use') {
      const toolName = block.name;
      const toolInput = block.input;

      console.log(`processClaudeResponse: Processing tool_use - ${toolName}`);

      switch (toolName) {
        case 'generateProjectStructure':
          result.action = 'generated';
          result.structure = toolInput.structure;
          result.itemCounts = toolInput.itemCounts;
          // Use summary if provided, otherwise keep any text message
          if (toolInput.summary) {
            result.message = toolInput.summary;
          }
          result.totalDurationDays = toolInput.totalDurationDays;
          break;

        case 'refineStructure':
          result.action = 'refined';
          result.structure = toolInput.structure;
          result.itemCounts = toolInput.itemCounts;
          if (toolInput.changesSummary) {
            result.message = toolInput.changesSummary;
          }
          result.refinementType = toolInput.action;
          result.targetArea = toolInput.targetArea;
          break;

        case 'editPlanItems':
          result.action = 'edit';
          result.operations = toolInput.operations;
          if (toolInput.summary) {
            result.message = toolInput.summary;
          }
          break;

        case 'askClarification':
          result.clarificationNeeded = true;
          result.questions = toolInput.questions;
          if (toolInput.reason) {
            result.message = toolInput.reason;
          }
          break;
          
        default:
          console.log(`processClaudeResponse: Unknown tool - ${toolName}`);
      }
    }
  }

  // Log final result state
  console.log(`processClaudeResponse: Final state - action=${result.action}, hasMessage=${!!result.message}, hasStructure=${!!result.structure}`);

  return result;
}
