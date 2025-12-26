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
  maxDuration: 60, // 60 seconds for document processing (Node.js runtime)
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

const SYSTEM_PROMPT = `You are a project planning assistant integrated into a project management tool. Your role is to help users convert natural language project descriptions into structured work breakdown structures.

## Your Capabilities

1. **Generate Project Structures**: Convert project descriptions into hierarchical plans with:
   - **Milestones**: Major phases or checkpoints (e.g., "Phase 1: Discovery", "MVP Launch")
   - **Deliverables**: Tangible outputs under milestones (e.g., "User Research Report", "API Documentation")
   - **Tasks**: Specific work items under deliverables (e.g., "Conduct user interviews", "Write endpoint specs")

2. **Refine Structures**: Modify existing structures based on feedback:
   - Add more detail to specific areas
   - Adjust durations
   - Add or remove items
   - Restructure hierarchy

3. **Ask Clarifying Questions**: When descriptions are vague, ask targeted questions about:
   - Project scope and objectives
   - Timeline constraints
   - Team size and capabilities
   - Dependencies and constraints

## Guidelines

### Structure Rules
- Maximum 3 levels of hierarchy: Milestone → Deliverable → Task
- Each milestone should have 2-5 deliverables
- Each deliverable should have 2-8 tasks
- Use clear, action-oriented names for tasks
- Keep names concise (under 50 characters)

### Duration Estimation
- Tasks: 0.5 to 5 days typically
- Deliverables: Sum of task durations
- Milestones: Sum of deliverable durations (some may run in parallel)
- Be realistic - add buffer for reviews and iterations

### Best Practices
- Start with the end goal and work backwards
- Group related work into logical deliverables
- Include review/approval tasks where appropriate
- Consider dependencies between items
- Include testing/QA where relevant

## Response Format

Always use the appropriate tool:
- Use \`generateProjectStructure\` for new project plans
- Use \`refineStructure\` when modifying existing plans
- Use \`askClarification\` when you need more information

Never output raw JSON - always use tools to return structured data.

Be conversational and helpful. Explain your reasoning when generating structures.`;

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
      error: `Unsupported document type: ${document.mediaType}. Allowed: PDF, JPEG, PNG, WebP, GIF` 
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
    const { messages, projectContext, currentStructure, document } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array required' });
    }

    // Validate document if provided
    if (document) {
      const validation = validateDocument(document);
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
    }

    // Build context-aware system prompt
    let systemPrompt = SYSTEM_PROMPT;
    
    // Add document analysis prompt if document is provided
    if (document) {
      systemPrompt += DOCUMENT_ANALYSIS_PROMPT;
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

    // Process messages - attach document to the last user message if provided
    let processedMessages = messages;
    if (document && messages.length > 0) {
      processedMessages = messages.map((msg, index) => {
        // Attach document to the last user message
        if (index === messages.length - 1 && msg.role === 'user') {
          return buildMessageWithDocument(msg.content, document);
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
