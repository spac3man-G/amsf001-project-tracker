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
 * @version 1.2
 * @created 26 December 2025
 * @updated 26 December 2025 - Converted to Node.js runtime for 60s timeout
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
    description: "Generate a hierarchical project structure with milestones, deliverables, and tasks from a project description. Use this when the user describes a new project or wants to create a plan from scratch.",
    input_schema: {
      type: "object",
      properties: {
        structure: {
          type: "array",
          description: "Hierarchical array of project items. Milestones at top level, deliverables nested under milestones, tasks nested under deliverables.",
          items: {
            type: "object",
            properties: {
              item_type: {
                type: "string",
                enum: ["milestone", "deliverable", "task"],
                description: "Type of item: milestone (phase/checkpoint), deliverable (tangible output), task (work item)"
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
                description: "Nested child items (deliverables under milestones, tasks under deliverables)",
                items: {
                  type: "object",
                  properties: {
                    item_type: { type: "string", enum: ["milestone", "deliverable", "task"] },
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
              item_type: { type: "string", enum: ["milestone", "deliverable", "task"] },
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
                  item_type: { type: "string", enum: ["milestone", "deliverable", "task"] },
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
   - **Milestones**: Major phases or checkpoints (e.g., "Phase 1: Discovery", "MVP Launch")
   - **Deliverables**: Tangible outputs under milestones (e.g., "User Research Report", "API Documentation")
   - **Tasks**: Specific work items under deliverables (e.g., "Conduct user interviews", "Write endpoint specs")

2. **Edit Existing Plans**: Make changes to the user's current plan:
   - Add new items (milestones, deliverables, tasks)
   - Remove items
   - Rename items
   - Update properties (dates, status, progress, descriptions)
   - Copy items
   - Move items to different parents

3. **Refine Generated Structures**: Modify structures you've generated based on feedback

4. **Ask Clarifying Questions**: When descriptions are vague, ask targeted questions

## Guidelines

### Hierarchy Rules (IMPORTANT)
- Milestones can only be at root level (no parent)
- Deliverables MUST be under a Milestone
- Tasks MUST be under a Deliverable OR another Task
- Maximum 3 levels: Milestone → Deliverable → Task

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
- Preserve existing data when making edits`;

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
- **Meeting Notes**: Identify action items and decisions that need planning`;

// ============================================
// DOCUMENT VALIDATION
// ============================================

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'application/vnd.ms-powerpoint', // .ppt
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
];

function validateDocument(document) {
  if (!document) return { valid: true }; // Document is optional
  
  if (!document.data || !document.mediaType) {
    return { valid: false, error: 'Document must include data and mediaType' };
  }
  
  if (!ALLOWED_DOCUMENT_TYPES.includes(document.mediaType)) {
    return { 
      valid: false, 
      error: `Unsupported document type: ${document.mediaType}. Allowed: PDF, Word, PowerPoint, Excel, and images.` 
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
  
  // Document types that use 'document' type in Claude API
  const documentTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ];
  
  // Add all documents first
  for (const doc of documents) {
    if (documentTypes.includes(doc.mediaType)) {
      content.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: doc.mediaType,
          data: doc.data
        }
      });
    } else {
      // Image types
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: doc.mediaType,
          data: doc.data
        }
      });
    }
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
        max_tokens: 4096,
        system: systemPrompt,
        tools: TOOLS,
        messages: processedMessages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      return res.status(500).json({ 
        error: 'AI service error',
        details: response.status 
      });
    }

    const data = await response.json();

    // Log token usage
    if (data.usage) {
      const cost = (data.usage.input_tokens * TOKEN_COSTS.input / 1000000) + 
                   (data.usage.output_tokens * TOKEN_COSTS.output / 1000000);
      console.log(`Planning AI - Tokens: ${data.usage.input_tokens} in, ${data.usage.output_tokens} out, Cost: $${cost.toFixed(4)}`);
    }

    // Process response
    const result = processClaudeResponse(data);

    return res.status(200).json(result);

  } catch (error) {
    console.error('Planning AI error:', error);
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

  // Process content blocks
  for (const block of data.content) {
    if (block.type === 'text') {
      result.message = block.text;
    } else if (block.type === 'tool_use') {
      const toolName = block.name;
      const toolInput = block.input;

      switch (toolName) {
        case 'generateProjectStructure':
          result.action = 'generated';
          result.structure = toolInput.structure;
          result.itemCounts = toolInput.itemCounts;
          result.message = toolInput.summary;
          result.totalDurationDays = toolInput.totalDurationDays;
          break;

        case 'refineStructure':
          result.action = 'refined';
          result.structure = toolInput.structure;
          result.itemCounts = toolInput.itemCounts;
          result.message = toolInput.changesSummary;
          result.refinementType = toolInput.action;
          result.targetArea = toolInput.targetArea;
          break;

        case 'editPlanItems':
          result.action = 'edit';
          result.operations = toolInput.operations;
          result.message = toolInput.summary;
          break;

        case 'askClarification':
          result.clarificationNeeded = true;
          result.questions = toolInput.questions;
          result.message = toolInput.reason;
          break;
      }
    }
  }

  return result;
}
