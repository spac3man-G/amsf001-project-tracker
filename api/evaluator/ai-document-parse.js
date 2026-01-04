/**
 * AI Document Parse - Vercel Serverless Function
 * 
 * Parses uploaded documents to extract requirements using Claude AI.
 * Supports PDF, DOCX, and text documents.
 * 
 * Features:
 * - Requirements extraction from document text
 * - Category suggestions based on content
 * - Priority inference from language
 * - Confidence scoring for each extraction
 * - AI task logging for audit trail
 * 
 * @version 1.0
 * @created January 4, 2026
 * @phase Phase 8A - Document Parsing & Gap Analysis (Task 8A.1, 8A.2)
 */

import { createClient } from '@supabase/supabase-js';

export const config = {
  maxDuration: 120, // 120 seconds for document processing
};

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MODEL = 'claude-sonnet-4-20250514'; // Cost-effective for parsing

// Initialize Supabase client
let supabaseClient = null;
function getSupabase() {
  if (!supabaseClient && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  }
  return supabaseClient;
}

// Token costs for monitoring (per 1M tokens)
const TOKEN_COSTS = {
  input: 3.00,
  output: 15.00,
};

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

const TOOLS = [
  {
    name: "extractRequirements",
    description: "Extract requirements from the document content. Each requirement should be atomic, testable, and traceable. Include confidence scores for each extraction.",
    input_schema: {
      type: "object",
      properties: {
        requirements: {
          type: "array",
          description: "Array of extracted requirements",
          items: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Clear, concise requirement title (max 100 chars)"
              },
              description: {
                type: "string",
                description: "Detailed description of the requirement"
              },
              priority: {
                type: "string",
                enum: ["must_have", "should_have", "could_have", "wont_have"],
                description: "MoSCoW priority inferred from language (e.g., 'must', 'should', 'essential', 'critical' = must_have)"
              },
              category_suggestion: {
                type: "string",
                description: "Suggested category based on requirement content (e.g., 'Security', 'Performance', 'Usability', 'Integration', 'Compliance', 'Functional', 'Technical')"
              },
              source_section: {
                type: "string",
                description: "Section or heading in the document where this requirement was found"
              },
              source_quote: {
                type: "string",
                description: "Direct quote from document that supports this requirement (max 200 chars)"
              },
              confidence: {
                type: "number",
                minimum: 0,
                maximum: 1,
                description: "Confidence score (0-1) that this is a valid requirement"
              },
              rationale: {
                type: "string",
                description: "Brief explanation of why this was identified as a requirement"
              }
            },
            required: ["title", "description", "priority", "confidence"]
          }
        },
        document_summary: {
          type: "string",
          description: "Brief summary of the document's purpose and scope"
        },
        extraction_stats: {
          type: "object",
          properties: {
            total_extracted: { type: "integer" },
            by_priority: {
              type: "object",
              properties: {
                must_have: { type: "integer" },
                should_have: { type: "integer" },
                could_have: { type: "integer" },
                wont_have: { type: "integer" }
              }
            },
            average_confidence: { type: "number" }
          }
        },
        warnings: {
          type: "array",
          items: { type: "string" },
          description: "Any warnings about document quality, ambiguous requirements, or parsing issues"
        }
      },
      required: ["requirements", "document_summary", "extraction_stats"]
    }
  }
];

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const SYSTEM_PROMPT = `You are an expert business analyst specializing in extracting requirements from documents.

Your task is to analyze the provided document and extract clear, actionable requirements that could be used in a vendor evaluation or system procurement process.

Guidelines for requirement extraction:
1. **Atomic**: Each requirement should address a single capability or constraint
2. **Testable**: Requirements should be verifiable (avoid vague terms like "user-friendly")
3. **Unambiguous**: Use clear, specific language
4. **Traceable**: Note where in the document each requirement comes from

Priority inference rules (MoSCoW method):
- "must", "shall", "required", "essential", "mandatory", "critical" → must_have
- "should", "expected", "important", "preferred" → should_have
- "may", "could", "nice to have", "optional", "desirable" → could_have
- "will not", "out of scope", "future", "deferred" → wont_have

Category suggestions (common categories):
- Functional: Core business capabilities
- Technical: Architecture, infrastructure, integrations
- Security: Access control, encryption, compliance
- Performance: Speed, scalability, reliability
- Usability: User experience, accessibility
- Compliance: Regulatory, legal requirements
- Integration: External system connections
- Reporting: Analytics, dashboards, exports
- Support: Training, documentation, maintenance

Confidence scoring:
- 0.9-1.0: Explicit requirement statement in document
- 0.7-0.9: Clear implicit requirement from context
- 0.5-0.7: Inferred requirement, may need validation
- Below 0.5: Very uncertain, might not be a requirement

Always use the extractRequirements tool to structure your output.`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create or update AI task record for audit trail
 */
async function createAITask(supabase, evaluationProjectId, userId, documentId, documentName) {
  const { data, error } = await supabase
    .from('ai_tasks')
    .insert({
      evaluation_project_id: evaluationProjectId,
      task_type: 'document_parse',
      status: 'processing',
      input_data: {
        document_id: documentId,
        document_name: documentName
      },
      initiated_by: userId,
      started_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create AI task:', error);
    return null;
  }
  return data;
}

/**
 * Update AI task with results
 */
async function updateAITask(supabase, taskId, status, outputData, usage, error = null) {
  const updateData = {
    status,
    output_data: outputData,
    completed_at: new Date().toISOString(),
    duration_ms: outputData?.duration_ms
  };

  if (usage) {
    updateData.input_tokens = usage.input_tokens;
    updateData.output_tokens = usage.output_tokens;
    updateData.model_used = MODEL;
  }

  if (error) {
    updateData.error_message = error.message || String(error);
    updateData.error_details = { stack: error.stack };
  }

  await supabase
    .from('ai_tasks')
    .update(updateData)
    .eq('id', taskId);
}

/**
 * Update document parse status
 */
async function updateDocumentParseStatus(supabase, documentId, status, parseResults = null) {
  const updateData = {
    parse_status: status,
    parsed_at: status === 'complete' ? new Date().toISOString() : null
  };

  if (parseResults) {
    updateData.parse_results = parseResults;
  }

  await supabase
    .from('evaluation_documents')
    .update(updateData)
    .eq('id', documentId);
}

/**
 * Get document content from Supabase Storage
 */
async function getDocumentContent(supabase, filePath) {
  // Download file from storage
  const { data, error } = await supabase.storage
    .from('evaluation-documents')
    .download(filePath);

  if (error) {
    throw new Error(`Failed to download document: ${error.message}`);
  }

  // Convert to text based on file type
  const fileExt = filePath.split('.').pop().toLowerCase();
  
  if (fileExt === 'txt' || fileExt === 'md' || fileExt === 'csv') {
    return await data.text();
  }
  
  if (fileExt === 'pdf') {
    // For PDFs, we'll send as base64 to Claude for vision processing
    const buffer = await data.arrayBuffer();
    return {
      type: 'pdf',
      base64: Buffer.from(buffer).toString('base64')
    };
  }

  // For other formats, try to extract text
  return await data.text();
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate environment
  if (!ANTHROPIC_API_KEY) {
    console.error('Missing ANTHROPIC_API_KEY');
    return res.status(500).json({ error: 'AI service not configured' });
  }

  const supabase = getSupabase();
  if (!supabase) {
    console.error('Missing Supabase configuration');
    return res.status(500).json({ error: 'Database service not configured' });
  }

  const startTime = Date.now();
  let aiTask = null;

  try {
    const { 
      documentId, 
      evaluationProjectId, 
      userId,
      documentContent,  // Optional: pre-extracted content
      documentName 
    } = req.body;

    // Validate required fields
    if (!documentId || !evaluationProjectId || !userId) {
      return res.status(400).json({ 
        error: 'Missing required fields: documentId, evaluationProjectId, userId' 
      });
    }

    // Create AI task record
    aiTask = await createAITask(supabase, evaluationProjectId, userId, documentId, documentName);

    // Update document status to processing
    await updateDocumentParseStatus(supabase, documentId, 'processing');

    // Get document content if not provided
    let content = documentContent;
    let isVisionRequest = false;

    if (!content) {
      // Fetch document from database to get file path
      const { data: doc, error: docError } = await supabase
        .from('evaluation_documents')
        .select('file_path, name, file_type')
        .eq('id', documentId)
        .single();

      if (docError || !doc) {
        throw new Error('Document not found');
      }

      content = await getDocumentContent(supabase, doc.file_path);
      
      if (typeof content === 'object' && content.type === 'pdf') {
        isVisionRequest = true;
      }
    }

    // Build messages for Claude
    let messages;
    
    if (isVisionRequest) {
      // Use vision API for PDF
      messages = [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: content.base64
              }
            },
            {
              type: "text",
              text: `Please analyze this document and extract all requirements. The document is: ${documentName}`
            }
          ]
        }
      ];
    } else {
      // Text-based request
      messages = [
        {
          role: "user",
          content: `Please analyze the following document and extract all requirements.\n\nDocument: ${documentName}\n\n---\n\n${content}`
        }
      ];
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
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        tool_choice: { type: "tool", name: "extractRequirements" },
        messages
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const duration = Date.now() - startTime;

    // Extract tool use result
    let extractedData = null;
    for (const block of result.content) {
      if (block.type === 'tool_use' && block.name === 'extractRequirements') {
        extractedData = block.input;
        break;
      }
    }

    if (!extractedData) {
      throw new Error('No requirements extraction result from AI');
    }

    // Add metadata
    extractedData.duration_ms = duration;
    extractedData.model = MODEL;
    extractedData.parsed_at = new Date().toISOString();

    // Update document with parse results
    await updateDocumentParseStatus(supabase, documentId, 'complete', extractedData);

    // Update AI task
    if (aiTask) {
      await updateAITask(supabase, aiTask.id, 'complete', extractedData, result.usage);
    }

    // Calculate cost
    const cost = result.usage 
      ? (result.usage.input_tokens * TOKEN_COSTS.input / 1000000) + 
        (result.usage.output_tokens * TOKEN_COSTS.output / 1000000)
      : 0;

    // Return success response
    return res.status(200).json({
      success: true,
      documentId,
      ...extractedData,
      usage: result.usage,
      estimatedCostUSD: cost.toFixed(6)
    });

  } catch (error) {
    console.error('Document parse error:', error);
    
    // Update statuses on error
    if (req.body?.documentId) {
      await updateDocumentParseStatus(supabase, req.body.documentId, 'failed');
    }
    if (aiTask) {
      await updateAITask(supabase, aiTask.id, 'failed', null, null, error);
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to parse document'
    });
  }
}
