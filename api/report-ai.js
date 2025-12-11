/**
 * Report Builder AI Assistant - Vercel Edge Function
 * 
 * Provides AI capabilities for the Report Builder Wizard:
 * - Section Discovery: Natural language → suggest sections to add
 * - Filter Configuration: Natural language → update section configs
 * - Content Generation: Generate text for summaries, lessons learned, etc.
 * - Explanation: Explain what sections show and how to configure them
 * 
 * @version 1.0
 * @created 11 December 2025
 * @see docs/IMPLEMENTATION-Report-Builder-Wizard.md Segment 10
 */

export const config = {
  runtime: 'edge',
};

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Model configuration
const MODEL = 'claude-sonnet-4-5-20250929';

// Token costs for monitoring (per 1M tokens)
const TOKEN_COSTS = {
  input: 3.00,
  output: 15.00,
};

// ============================================
// SECTION TYPE DEFINITIONS (for AI context)
// ============================================

const SECTION_TYPES = {
  // Backward-looking sections
  milestone_summary: {
    name: 'Milestone Summary',
    description: 'Overview of milestone status and progress during the reporting period',
    category: 'backward',
    suggestedFor: ['monthly report', 'progress report', 'status update', 'retrospective']
  },
  deliverable_summary: {
    name: 'Deliverable Summary',
    description: 'Summary of deliverable status and completion',
    category: 'backward',
    suggestedFor: ['delivery report', 'progress report', 'status update']
  },
  kpi_performance: {
    name: 'KPI Performance',
    description: 'Key Performance Indicators with current values vs targets',
    category: 'backward',
    suggestedFor: ['performance report', 'monthly report', 'management report']
  },
  quality_standards: {
    name: 'Quality Standards',
    description: 'Quality metrics and standards compliance status',
    category: 'backward',
    suggestedFor: ['quality report', 'compliance report']
  },
  budget_analysis: {
    name: 'Budget Analysis',
    description: 'Budget vs actual spend comparison with variance analysis',
    category: 'backward',
    suggestedFor: ['financial report', 'budget report', 'monthly report', 'management report']
  },
  raid_summary: {
    name: 'RAID Summary',
    description: 'Overview of Risks, Assumptions, Issues, and Dependencies',
    category: 'backward',
    suggestedFor: ['risk report', 'status update', 'management report', 'monthly report']
  },
  timesheet_summary: {
    name: 'Timesheet Summary',
    description: 'Summary of time tracking and resource utilisation',
    category: 'backward',
    suggestedFor: ['resource report', 'utilisation report', 'monthly report']
  },
  expense_summary: {
    name: 'Expense Summary',
    description: 'Summary of expenses by category and status',
    category: 'backward',
    suggestedFor: ['expense report', 'financial report', 'monthly report']
  },
  
  // Forward-looking sections
  forward_look: {
    name: 'Forward Look',
    description: 'Combined view of upcoming milestones, deliverables, and activities',
    category: 'forward',
    suggestedFor: ['planning report', 'look-ahead', 'monthly report', 'management report']
  },
  upcoming_milestones: {
    name: 'Upcoming Milestones',
    description: 'Milestones scheduled for the next period',
    category: 'forward',
    suggestedFor: ['planning report', 'look-ahead', 'status update']
  },
  upcoming_deliverables: {
    name: 'Upcoming Deliverables',
    description: 'Deliverables due in the next period',
    category: 'forward',
    suggestedFor: ['planning report', 'look-ahead', 'delivery schedule']
  },
  
  // Content sections
  executive_summary: {
    name: 'Executive Summary',
    description: 'High-level overview and key highlights (AI-generated or manual)',
    category: 'content',
    suggestedFor: ['any report', 'management report', 'monthly report']
  },
  lessons_learned: {
    name: 'Lessons Learned',
    description: 'Key learnings and improvements identified',
    category: 'content',
    suggestedFor: ['retrospective', 'monthly report', 'closure report']
  },
  custom_text: {
    name: 'Custom Text',
    description: 'Free-form text section for any custom content',
    category: 'content',
    suggestedFor: ['any custom content']
  },
  resource_summary: {
    name: 'Resource Summary',
    description: 'Overview of team members and resource allocation',
    category: 'content',
    suggestedFor: ['resource report', 'team report', 'monthly report']
  }
};

// ============================================
// TOOL DEFINITIONS
// ============================================

const TOOLS = [
  {
    name: "suggestSections",
    description: "Suggest report sections based on user's description of what they need. Returns a list of recommended sections with reasons.",
    input_schema: {
      type: "object",
      properties: {
        reportType: {
          type: "string",
          description: "The type or purpose of report the user wants (e.g., 'monthly retrospective', 'budget review')"
        },
        requirements: {
          type: "array",
          items: { type: "string" },
          description: "List of specific requirements or topics to cover"
        }
      },
      required: ["reportType"]
    }
  },
  {
    name: "addSection",
    description: "Add a section to the user's report. Use this when the user confirms they want to add a suggested section.",
    input_schema: {
      type: "object",
      properties: {
        sectionType: {
          type: "string",
          enum: Object.keys(SECTION_TYPES),
          description: "The type of section to add"
        },
        customConfig: {
          type: "object",
          description: "Optional custom configuration for the section"
        }
      },
      required: ["sectionType"]
    }
  },
  {
    name: "updateSectionConfig",
    description: "Update the configuration of an existing section in the report.",
    input_schema: {
      type: "object",
      properties: {
        sectionId: {
          type: "string",
          description: "The ID of the section to update"
        },
        configUpdates: {
          type: "object",
          description: "Configuration changes to apply"
        }
      },
      required: ["sectionId", "configUpdates"]
    }
  },
  {
    name: "generateContent",
    description: "Generate text content for a text-based section like executive summary, lessons learned, or custom text.",
    input_schema: {
      type: "object",
      properties: {
        contentType: {
          type: "string",
          enum: ["executive_summary", "lessons_learned", "custom_text"],
          description: "Type of content to generate"
        },
        context: {
          type: "string",
          description: "Additional context or instructions for content generation"
        },
        tone: {
          type: "string",
          enum: ["formal", "professional", "concise", "detailed"],
          description: "Desired tone for the content"
        },
        maxWords: {
          type: "number",
          description: "Approximate maximum word count"
        }
      },
      required: ["contentType"]
    }
  },
  {
    name: "explainSection",
    description: "Explain what a section type shows and how to configure it.",
    input_schema: {
      type: "object",
      properties: {
        sectionType: {
          type: "string",
          enum: Object.keys(SECTION_TYPES),
          description: "The section type to explain"
        }
      },
      required: ["sectionType"]
    }
  },
  {
    name: "getCurrentReport",
    description: "Get information about the current report configuration including sections already added.",
    input_schema: {
      type: "object",
      properties: {},
      required: []
    }
  }
];

// ============================================
// TOOL EXECUTION FUNCTIONS
// ============================================

function executeSuggestSections(params, context) {
  const { reportType, requirements = [] } = params;
  const reportTypeLower = reportType.toLowerCase();
  
  const suggestions = [];
  const alreadyAdded = new Set((context.currentSections || []).map(s => s.type));
  
  // Score each section type based on relevance
  for (const [type, config] of Object.entries(SECTION_TYPES)) {
    if (alreadyAdded.has(type)) continue;
    
    let score = 0;
    let reasons = [];
    
    // Check if report type matches suggested uses
    for (const suggested of config.suggestedFor) {
      if (reportTypeLower.includes(suggested) || suggested.includes(reportTypeLower)) {
        score += 3;
        reasons.push(`Commonly included in ${suggested}s`);
      }
    }
    
    // Check requirements
    for (const req of requirements) {
      const reqLower = req.toLowerCase();
      if (config.name.toLowerCase().includes(reqLower) || 
          config.description.toLowerCase().includes(reqLower)) {
        score += 2;
        reasons.push(`Matches requirement: "${req}"`);
      }
    }
    
    // Add category-based suggestions for common report types
    if (reportTypeLower.includes('retrospective') || reportTypeLower.includes('monthly')) {
      if (config.category === 'backward') score += 1;
      if (type === 'executive_summary') score += 2;
      if (type === 'lessons_learned') score += 2;
      if (type === 'forward_look') score += 2;
    }
    
    if (reportTypeLower.includes('status') || reportTypeLower.includes('progress')) {
      if (type === 'milestone_summary') score += 2;
      if (type === 'deliverable_summary') score += 2;
      if (type === 'raid_summary') score += 1;
    }
    
    if (reportTypeLower.includes('financial') || reportTypeLower.includes('budget')) {
      if (type === 'budget_analysis') score += 3;
      if (type === 'expense_summary') score += 2;
      if (type === 'timesheet_summary') score += 1;
    }
    
    if (score > 0) {
      suggestions.push({
        type,
        name: config.name,
        description: config.description,
        category: config.category,
        relevanceScore: score,
        reasons: [...new Set(reasons)].slice(0, 2)
      });
    }
  }
  
  // Sort by score and return top suggestions
  suggestions.sort((a, b) => b.relevanceScore - a.relevanceScore);
  
  return {
    reportType,
    suggestions: suggestions.slice(0, 8),
    alreadyInReport: Array.from(alreadyAdded).map(type => ({
      type,
      name: SECTION_TYPES[type]?.name || type
    }))
  };
}

function executeAddSection(params, context) {
  const { sectionType, customConfig } = params;
  
  if (!SECTION_TYPES[sectionType]) {
    return { 
      success: false, 
      error: `Unknown section type: ${sectionType}` 
    };
  }
  
  const sectionInfo = SECTION_TYPES[sectionType];
  
  return {
    success: true,
    action: 'ADD_SECTION',
    sectionType,
    sectionName: sectionInfo.name,
    customConfig: customConfig || {},
    message: `Ready to add "${sectionInfo.name}" section to your report.`
  };
}

function executeUpdateSectionConfig(params, context) {
  const { sectionId, configUpdates } = params;
  
  // Find the section in current sections
  const section = (context.currentSections || []).find(s => s.id === sectionId);
  
  if (!section) {
    return {
      success: false,
      error: `Section not found: ${sectionId}`
    };
  }
  
  return {
    success: true,
    action: 'UPDATE_SECTION_CONFIG',
    sectionId,
    configUpdates,
    message: `Ready to update configuration for "${section.name}".`
  };
}

function executeGenerateContent(params, context) {
  const { contentType, userContext, tone = 'professional', maxWords = 200 } = params;
  const projectContext = context.projectContext || {};
  
  // Generate content based on type and available context
  let generatedContent = '';
  
  switch (contentType) {
    case 'executive_summary':
      generatedContent = generateExecutiveSummary(projectContext, context, tone, maxWords);
      break;
    case 'lessons_learned':
      generatedContent = generateLessonsLearned(projectContext, context, tone, maxWords);
      break;
    case 'custom_text':
      generatedContent = `[Custom content placeholder - please provide specific instructions for what you'd like to include]`;
      break;
    default:
      generatedContent = '[Content generation not available for this type]';
  }
  
  return {
    success: true,
    action: 'GENERATED_CONTENT',
    contentType,
    content: generatedContent,
    tone,
    wordCount: generatedContent.split(/\s+/).length,
    message: `Generated ${contentType.replace('_', ' ')} content. You can edit this in the section configuration.`
  };
}

function generateExecutiveSummary(projectContext, context, tone, maxWords) {
  const projectName = projectContext.projectName || 'the project';
  const reportingPeriod = context.parameters?.reportingPeriod || 'the reporting period';
  
  // This would ideally use actual project data, but for now we provide a template
  return `During ${reportingPeriod}, ${projectName} has made significant progress across key deliverables and milestones. 

The team has maintained focus on our primary objectives while managing emerging risks and dependencies effectively. Budget utilisation remains within acceptable parameters, with careful attention to cost control measures.

Key highlights:
• Milestone progress continues on track
• Resource allocation has been optimised for efficiency
• Stakeholder engagement remains strong

Looking ahead, the team will continue to prioritise critical deliverables while maintaining quality standards and managing identified risks.`;
}

function generateLessonsLearned(projectContext, context, tone, maxWords) {
  return `**What Went Well**
• Effective collaboration between team members led to early completion of key deliverables
• Regular communication with stakeholders helped maintain alignment on priorities
• Proactive risk identification allowed for timely mitigation actions

**Areas for Improvement**
• Earlier engagement with technical dependencies could reduce last-minute adjustments
• More frequent checkpoint reviews would help identify issues sooner
• Documentation practices could be strengthened to support knowledge transfer

**Actions for Next Period**
• Implement weekly technical sync meetings
• Establish clearer escalation paths for blockers
• Create templates for recurring documentation needs`;
}

function executeExplainSection(params) {
  const { sectionType } = params;
  
  if (!SECTION_TYPES[sectionType]) {
    return {
      success: false,
      error: `Unknown section type: ${sectionType}`
    };
  }
  
  const section = SECTION_TYPES[sectionType];
  
  // Build detailed explanation
  const explanations = {
    milestone_summary: {
      whatItShows: "Displays all milestones with their status, progress percentage, planned vs actual dates, and billable amounts.",
      configOptions: [
        "Status filter: Show only milestones with specific status (Completed, In Progress, Not Started)",
        "Display format: Table or cards view",
        "Show progress bars: Visual progress indication"
      ],
      bestUsedFor: "Monthly reports, retrospectives, and status updates to show milestone progress over the reporting period."
    },
    deliverable_summary: {
      whatItShows: "Lists deliverables with their status, due dates, and associated milestones.",
      configOptions: [
        "Status filter: Filter by deliverable status",
        "Milestone filter: Show deliverables for specific milestones",
        "Group by milestone: Organise deliverables by their parent milestone"
      ],
      bestUsedFor: "Tracking delivery progress and highlighting upcoming or overdue items."
    },
    kpi_performance: {
      whatItShows: "Displays KPIs with current values, targets, variance, and RAG status indicators.",
      configOptions: [
        "Category filter: Show KPIs from specific categories",
        "Show trend: Include trend indicators",
        "Sort by: Status or category"
      ],
      bestUsedFor: "Performance reviews and management reports showing quantitative progress."
    },
    budget_analysis: {
      whatItShows: "Compares budget vs actual spend with variance calculations and percentage consumed.",
      configOptions: [
        "Group by: Overall project or by milestone",
        "Show forecast: Include forecast completion costs",
        "Include chart: Visual budget breakdown"
      ],
      bestUsedFor: "Financial reports, budget reviews, and management visibility into spend."
    },
    raid_summary: {
      whatItShows: "Overview of Risks, Assumptions, Issues, and Dependencies with status and priority.",
      configOptions: [
        "RAID types: Select which types to include (Risks, Assumptions, Issues, Dependencies)",
        "Status filter: Show only open items or all",
        "Priority filter: High, Medium, Low",
        "Max items: Limit number of items shown per type"
      ],
      bestUsedFor: "Status updates, risk reviews, and management escalations."
    },
    forward_look: {
      whatItShows: "Combined view of what's coming up - milestones, deliverables, and key activities for the next period.",
      configOptions: [
        "Look-ahead period: How many days/weeks ahead to show",
        "Include milestones: Toggle milestone visibility",
        "Include deliverables: Toggle deliverable visibility"
      ],
      bestUsedFor: "Planning discussions, look-ahead meetings, and setting expectations for the next period."
    },
    executive_summary: {
      whatItShows: "High-level narrative overview of the report period - typically appears at the start of the report.",
      configOptions: [
        "Content: Your summary text (can be AI-generated)",
        "Heading: Custom section heading"
      ],
      bestUsedFor: "Any report that needs a narrative overview - especially for management and stakeholder audiences."
    },
    lessons_learned: {
      whatItShows: "Structured capture of what went well, what could improve, and action items.",
      configOptions: [
        "Content: Your lessons learned text (can be AI-generated)",
        "Heading: Custom section heading"
      ],
      bestUsedFor: "Retrospectives, monthly reports, and continuous improvement tracking."
    }
  };
  
  const explanation = explanations[sectionType] || {
    whatItShows: section.description,
    configOptions: ["Configure using the section settings panel"],
    bestUsedFor: section.suggestedFor.join(', ')
  };
  
  return {
    success: true,
    sectionType,
    name: section.name,
    category: section.category,
    description: section.description,
    ...explanation
  };
}

function executeGetCurrentReport(context) {
  return {
    reportName: context.reportName || 'Untitled Report',
    templateName: context.templateName || 'Custom',
    reportingPeriod: context.parameters?.reportingPeriod || 'Not set',
    sectionCount: (context.currentSections || []).length,
    sections: (context.currentSections || []).map(s => ({
      id: s.id,
      type: s.type,
      name: s.name,
      category: SECTION_TYPES[s.type]?.category || 'unknown'
    })),
    availableSectionTypes: Object.keys(SECTION_TYPES).filter(
      type => !(context.currentSections || []).some(s => s.type === type)
    )
  };
}

// ============================================
// TOOL DISPATCHER
// ============================================

function executeTool(toolName, toolInput, context) {
  switch (toolName) {
    case 'suggestSections':
      return executeSuggestSections(toolInput, context);
    case 'addSection':
      return executeAddSection(toolInput, context);
    case 'updateSectionConfig':
      return executeUpdateSectionConfig(toolInput, context);
    case 'generateContent':
      return executeGenerateContent(toolInput, context);
    case 'explainSection':
      return executeExplainSection(toolInput);
    case 'getCurrentReport':
      return executeGetCurrentReport(context);
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// ============================================
// SYSTEM PROMPT
// ============================================

function buildSystemPrompt(context) {
  const sectionList = Object.entries(SECTION_TYPES)
    .map(([type, config]) => `- ${config.name} (${type}): ${config.description}`)
    .join('\n');
  
  return `You are an AI assistant helping users build project reports using a Report Builder Wizard. You help with:

1. **Section Discovery**: Suggest relevant sections based on what kind of report the user wants
2. **Configuration Help**: Explain what sections show and how to configure them
3. **Content Generation**: Generate text for summaries, lessons learned, and custom content
4. **Report Building**: Help add and arrange sections in the report

## Available Section Types
${sectionList}

## Current Context
- Report Name: ${context.reportName || 'Not set'}
- Template: ${context.templateName || 'Custom'}
- Current Step: ${context.currentStep || 'Section Builder'}
- Sections Added: ${(context.currentSections || []).length}

${context.currentSections?.length > 0 ? `
## Sections in Report
${context.currentSections.map((s, i) => `${i + 1}. ${s.name} (${s.type})`).join('\n')}
` : ''}

## Guidelines
- Be helpful and conversational
- When users describe what they need, suggest specific sections with reasons
- When asked to add sections, use the addSection tool
- When generating content, create professional, well-structured text
- Explain configuration options clearly when asked
- Keep responses concise but informative
- Use UK English spelling and date formats
- Format currency as GBP (£)

## Important
- If you suggest adding sections, confirm with the user before using the addSection tool
- When generating content, provide editable text the user can customise
- If unsure what the user wants, ask clarifying questions
- Always be ready to explain what any section does`;
}

// ============================================
// INPUT SANITISATION
// ============================================

function sanitizeMessage(content) {
  if (!content || typeof content !== 'string') return '';
  let sanitized = content.replace(/\0/g, '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  sanitized = sanitized.trim();
  if (sanitized.length > 4000) sanitized = sanitized.substring(0, 4000);
  return sanitized;
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .slice(-10) // Keep last 10 messages for context
    .filter(msg => msg && typeof msg === 'object')
    .map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: sanitizeMessage(msg.content),
    }))
    .filter(msg => msg.content.length > 0);
}

// ============================================
// RATE LIMITING
// ============================================

const rateLimitStore = new Map();
const RATE_LIMIT = {
  maxRequests: 20,
  windowMs: 60 * 1000,
};

function checkRateLimit(userId) {
  const now = Date.now();
  const key = `report-ai:${userId}`;
  let record = rateLimitStore.get(key);
  
  if (record && record.resetAt <= now) {
    rateLimitStore.delete(key);
    record = null;
  }
  
  if (!record) {
    record = { count: 1, resetAt: now + RATE_LIMIT.windowMs };
    rateLimitStore.set(key, record);
    return { allowed: true, remaining: RATE_LIMIT.maxRequests - 1, resetAt: record.resetAt };
  }
  
  record.count++;
  if (record.count > RATE_LIMIT.maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }
  
  return { allowed: true, remaining: RATE_LIMIT.maxRequests - record.count, resetAt: record.resetAt };
}

// ============================================
// MAIN HANDLER
// ============================================

export default async function handler(req) {
  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { 
      messages, 
      reportContext,
      projectContext,
      userContext 
    } = body;

    // Rate limiting
    const userId = userContext?.email || req.headers.get('x-forwarded-for')?.split(',')[0] || 'anonymous';
    const rateLimit = checkRateLimit(userId);
    
    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({ 
        error: 'Rate limit exceeded. Please wait a moment.',
        retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Sanitise messages
    const sanitizedMessages = sanitizeMessages(messages);
    if (sanitizedMessages.length === 0) {
      return new Response(JSON.stringify({ error: 'No valid messages provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Build context for tool execution and system prompt
    const context = {
      reportName: reportContext?.reportName,
      templateName: reportContext?.templateName,
      currentStep: reportContext?.currentStep,
      currentSections: reportContext?.sections || [],
      parameters: reportContext?.parameters || {},
      projectContext: projectContext || {},
      userContext: userContext || {}
    };

    // Build system prompt
    const systemPrompt = buildSystemPrompt(context);

    // API call with tools
    let apiMessages = sanitizedMessages;
    let continueLoop = true;
    let iterations = 0;
    const maxIterations = 5;
    let finalResponse = null;
    let toolActions = []; // Collect actions for the frontend

    while (continueLoop && iterations < maxIterations) {
      iterations++;
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 2048,
          system: systemPrompt,
          tools: TOOLS,
          messages: apiMessages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Claude API error:', errorData);
        throw new Error('AI service error');
      }

      const data = await response.json();
      
      // Check if we need to handle tool use
      if (data.stop_reason === 'tool_use') {
        const toolUseBlocks = data.content.filter(block => block.type === 'tool_use');
        
        // Execute tools and collect results
        const toolResults = toolUseBlocks.map(toolUse => {
          const result = executeTool(toolUse.name, toolUse.input, context);
          
          // If the tool returns an action, collect it for the frontend
          if (result.action) {
            toolActions.push({
              type: result.action,
              ...result
            });
          }
          
          return {
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(result)
          };
        });
        
        // Add assistant response and tool results to messages
        apiMessages = [
          ...apiMessages,
          { role: 'assistant', content: data.content },
          { role: 'user', content: toolResults }
        ];
      } else {
        // No more tool use, we have our final response
        continueLoop = false;
        finalResponse = data;
      }
    }

    if (!finalResponse) {
      throw new Error('Failed to get response after tool execution');
    }

    // Extract text response
    const textContent = finalResponse.content.find(block => block.type === 'text');
    const responseText = textContent?.text || 'I apologize, but I was unable to generate a response.';

    return new Response(JSON.stringify({
      message: responseText,
      actions: toolActions,
      usage: finalResponse.usage,
      toolsUsed: iterations > 1,
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      },
    });

  } catch (error) {
    console.error('Report AI API error:', error);
    
    let userMessage = 'An error occurred while processing your request.';
    let statusCode = 500;
    
    if (error.message?.includes('API key')) {
      userMessage = 'AI service configuration error. Please contact support.';
    } else if (error.message?.includes('rate') || error.message?.includes('429')) {
      userMessage = 'AI service is temporarily busy. Please try again in a moment.';
      statusCode = 429;
    } else if (error.message?.includes('timeout')) {
      userMessage = 'Request took too long. Please try again.';
      statusCode = 504;
    }
    
    return new Response(JSON.stringify({ 
      error: userMessage,
      recoverable: statusCode !== 500
    }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
