/**
 * AI Service
 * 
 * Handles AI operations for the Evaluator tool including:
 * - Document parsing for requirements extraction
 * - Gap analysis
 * - Market research for vendor identification
 * - Requirement improvement suggestions
 * 
 * @version 2.0
 * @created January 4, 2026
 * @updated January 4, 2026 - Added Phase 8B features (market research, requirement improvement)
 * @phase Phase 8A - Document Parsing & Gap Analysis, Phase 8B - Market Research & AI Assistant
 */

import { supabase } from '../../lib/supabase';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * AI Task Types
 */
export const AI_TASK_TYPES = {
  DOCUMENT_PARSE: 'document_parse',
  GAP_ANALYSIS: 'gap_analysis',
  MARKET_RESEARCH: 'market_research',
  REQUIREMENT_SUGGEST: 'requirement_suggest',
  VENDOR_ANALYSIS: 'vendor_analysis',
  SCORE_SUGGEST: 'score_suggest',
  REPORT_GENERATE: 'report_generate',
  SUMMARY_GENERATE: 'summary_generate'
};

/**
 * AI Task Status
 */
export const AI_TASK_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETE: 'complete',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

/**
 * Task status configuration for UI
 */
export const AI_TASK_STATUS_CONFIG = {
  [AI_TASK_STATUS.PENDING]: {
    label: 'Pending',
    color: 'gray',
    icon: 'Clock'
  },
  [AI_TASK_STATUS.PROCESSING]: {
    label: 'Processing',
    color: 'blue',
    icon: 'Loader'
  },
  [AI_TASK_STATUS.COMPLETE]: {
    label: 'Complete',
    color: 'green',
    icon: 'CheckCircle'
  },
  [AI_TASK_STATUS.FAILED]: {
    label: 'Failed',
    color: 'red',
    icon: 'XCircle'
  },
  [AI_TASK_STATUS.CANCELLED]: {
    label: 'Cancelled',
    color: 'slate',
    icon: 'Ban'
  }
};

// ============================================================================
// AI SERVICE CLASS
// ============================================================================

class AIService {
  // ============================================================================
  // DOCUMENT PARSING (Phase 8A)
  // ============================================================================

  /**
   * Parse a document to extract requirements
   * 
   * @param {string} documentId - Document UUID
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {string} userId - User UUID
   * @param {string} documentName - Document name for context
   * @param {string} documentContent - Optional pre-extracted content
   * @returns {Promise<Object>} Parsed requirements result
   */
  async parseDocument(documentId, evaluationProjectId, userId, documentName, documentContent = null) {
    try {
      const response = await fetch('/api/evaluator/ai-document-parse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          documentId,
          evaluationProjectId,
          userId,
          documentName,
          documentContent
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to parse document');
      }

      return result;
    } catch (error) {
      console.error('AIService.parseDocument error:', error);
      throw error;
    }
  }

  // ============================================================================
  // GAP ANALYSIS (Phase 8A)
  // ============================================================================

  /**
   * Perform gap analysis on existing requirements
   * 
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {string} userId - User UUID
   * @param {Object} additionalContext - Optional context (industry, project type, focus areas)
   * @returns {Promise<Object>} Gap analysis result
   */
  async runGapAnalysis(evaluationProjectId, userId, additionalContext = {}) {
    try {
      const response = await fetch('/api/evaluator/ai-gap-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          evaluationProjectId,
          userId,
          additionalContext
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to run gap analysis');
      }

      return result;
    } catch (error) {
      console.error('AIService.runGapAnalysis error:', error);
      throw error;
    }
  }

  // ============================================================================
  // MARKET RESEARCH (Phase 8B)
  // ============================================================================

  /**
   * Run market research to identify potential vendors
   * 
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {string} userId - User UUID
   * @param {Object} additionalContext - Optional context (industry, budget, timeline)
   * @returns {Promise<Object>} Market research result
   */
  async runMarketResearch(evaluationProjectId, userId, additionalContext = {}) {
    try {
      const response = await fetch('/api/evaluator/ai-market-research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          evaluationProjectId,
          userId,
          additionalContext
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to run market research');
      }

      return result;
    } catch (error) {
      console.error('AIService.runMarketResearch error:', error);
      throw error;
    }
  }

  /**
   * Add researched vendors to the vendor list
   * 
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {string} userId - User UUID
   * @param {Array} vendors - Array of vendor recommendations from research
   * @returns {Promise<Object>} Import result
   */
  async addResearchedVendors(evaluationProjectId, userId, vendors) {
    try {
      // Prepare vendors for insertion
      const toInsert = vendors.map(vendor => ({
        evaluation_project_id: evaluationProjectId,
        name: vendor.name,
        description: vendor.description || null,
        website: vendor.website || null,
        status: 'identified',
        status_changed_at: new Date().toISOString(),
        status_changed_by: userId,
        notes: this._formatVendorNotes(vendor),
        portal_enabled: false
      }));

      // Insert vendors
      const { data, error } = await supabase
        .from('vendors')
        .insert(toInsert)
        .select();

      if (error) {
        console.error('Insert vendors error:', error);
        throw error;
      }

      return {
        total: vendors.length,
        imported: (data || []).length,
        vendors: data || []
      };
    } catch (error) {
      console.error('AIService.addResearchedVendors failed:', error);
      throw error;
    }
  }

  /**
   * Format vendor notes from AI research data
   * @private
   */
  _formatVendorNotes(vendor) {
    const parts = [];
    
    parts.push(`[AI Market Research - ${new Date().toLocaleDateString()}]`);
    
    if (vendor.market_position) {
      parts.push(`Market Position: ${vendor.market_position}`);
    }
    
    if (vendor.target_market) {
      parts.push(`Target Market: ${vendor.target_market}`);
    }
    
    if (vendor.fit_score) {
      parts.push(`Fit Score: ${vendor.fit_score}/10`);
    }
    
    if (vendor.fit_rationale) {
      parts.push(`Fit Rationale: ${vendor.fit_rationale}`);
    }
    
    if (vendor.strengths?.length) {
      parts.push(`\nStrengths:\n${vendor.strengths.map(s => `• ${s}`).join('\n')}`);
    }
    
    if (vendor.considerations?.length) {
      parts.push(`\nConsiderations:\n${vendor.considerations.map(c => `• ${c}`).join('\n')}`);
    }
    
    if (vendor.pricing_model) {
      parts.push(`\nPricing Model: ${vendor.pricing_model}`);
    }
    
    if (vendor.deployment_options?.length) {
      parts.push(`Deployment Options: ${vendor.deployment_options.join(', ')}`);
    }
    
    return parts.join('\n');
  }

  // ============================================================================
  // REQUIREMENT IMPROVEMENT (Phase 8B)
  // ============================================================================

  /**
   * Get AI suggestions to improve a requirement
   * 
   * @param {string} requirementId - Requirement UUID
   * @param {string} userId - User UUID
   * @returns {Promise<Object>} Suggestion result
   */
  async improveRequirement(requirementId, userId) {
    try {
      const response = await fetch('/api/evaluator/ai-requirement-suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requirementId,
          userId
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get requirement suggestions');
      }

      return result;
    } catch (error) {
      console.error('AIService.improveRequirement error:', error);
      throw error;
    }
  }

  /**
   * Get AI suggestions for a requirement from text (without saving first)
   * 
   * @param {Object} requirementText - Requirement text { title, description, priority, category }
   * @param {string} userId - User UUID
   * @param {string} evaluationProjectId - Optional project ID for context
   * @returns {Promise<Object>} Suggestion result
   */
  async suggestFromText(requirementText, userId, evaluationProjectId = null) {
    try {
      const response = await fetch('/api/evaluator/ai-requirement-suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requirementText: {
            ...requirementText,
            evaluationProjectId
          },
          userId
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get requirement suggestions');
      }

      return result;
    } catch (error) {
      console.error('AIService.suggestFromText error:', error);
      throw error;
    }
  }

  /**
   * Apply AI suggestion to update a requirement
   * 
   * @param {string} requirementId - Requirement UUID
   * @param {Object} suggestion - The improved_requirement from AI
   * @returns {Promise<Object>} Updated requirement
   */
  async applySuggestion(requirementId, suggestion) {
    try {
      const updates = {
        title: suggestion.title,
        description: suggestion.description
      };

      const { data, error } = await supabase
        .from('requirements')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', requirementId)
        .select();

      if (error) {
        console.error('Apply suggestion error:', error);
        throw error;
      }

      return data?.[0];
    } catch (error) {
      console.error('AIService.applySuggestion failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // RESPONSE ANALYSIS (v1.1 - Feature 1.1.2)
  // ============================================================================

  /**
   * Analyze a vendor response using AI
   *
   * @param {string} responseId - Vendor Response UUID
   * @param {string} userId - User UUID
   * @param {Object} options - Options { includeComparison, forceRefresh }
   * @returns {Promise<Object>} Analysis result
   */
  async analyzeResponse(responseId, userId, options = {}) {
    try {
      const response = await fetch('/api/evaluator/ai-analyze-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          responseId,
          userId,
          includeComparison: options.includeComparison !== false,
          forceRefresh: options.forceRefresh || false
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to analyze vendor response');
      }

      return result;
    } catch (error) {
      console.error('AIService.analyzeResponse error:', error);
      throw error;
    }
  }

  /**
   * Get cached AI analysis for a vendor response
   *
   * @param {string} responseId - Vendor Response UUID
   * @returns {Promise<Object|null>} Cached analysis or null
   */
  async getCachedAnalysis(responseId) {
    try {
      const { data, error } = await supabase
        .from('vendor_responses')
        .select('ai_analysis, ai_analyzed_at, ai_analyzed_by')
        .eq('id', responseId)
        .single();

      if (error) {
        console.error('AIService.getCachedAnalysis error:', error);
        return null;
      }

      if (!data?.ai_analysis) {
        return null;
      }

      return {
        ...data.ai_analysis,
        analyzedAt: data.ai_analyzed_at,
        analyzedBy: data.ai_analyzed_by
      };
    } catch (error) {
      console.error('AIService.getCachedAnalysis failed:', error);
      return null;
    }
  }

  /**
   * Clear cached AI analysis for a response (e.g., after response is updated)
   *
   * @param {string} responseId - Vendor Response UUID
   * @returns {Promise<void>}
   */
  async clearCachedAnalysis(responseId) {
    try {
      await supabase
        .from('vendor_responses')
        .update({
          ai_analysis: null,
          ai_analyzed_at: null,
          ai_analyzed_by: null
        })
        .eq('id', responseId);
    } catch (error) {
      console.error('AIService.clearCachedAnalysis failed:', error);
    }
  }

  // ============================================================================
  // TASK HISTORY & STATISTICS
  // ============================================================================

  /**
   * Get AI task history for an evaluation project
   * 
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of AI tasks
   */
  async getTaskHistory(evaluationProjectId, options = {}) {
    try {
      let query = supabase
        .from('ai_tasks')
        .select(`
          *,
          initiated_by_profile:profiles!initiated_by(id, full_name, email)
        `)
        .eq('evaluation_project_id', evaluationProjectId)
        .order('created_at', { ascending: false });

      if (options.taskType) {
        query = query.eq('task_type', options.taskType);
      }

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('AIService.getTaskHistory error:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('AIService.getTaskHistory failed:', error);
      throw error;
    }
  }

  /**
   * Get a specific AI task by ID
   * 
   * @param {string} taskId - AI Task UUID
   * @returns {Promise<Object>} AI task
   */
  async getTask(taskId) {
    try {
      const { data, error } = await supabase
        .from('ai_tasks')
        .select(`
          *,
          initiated_by_profile:profiles!initiated_by(id, full_name, email)
        `)
        .eq('id', taskId)
        .single();

      if (error) {
        console.error('AIService.getTask error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('AIService.getTask failed:', error);
      throw error;
    }
  }

  /**
   * Get AI usage statistics for an evaluation project
   * 
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Object>} Usage statistics
   */
  async getUsageStats(evaluationProjectId) {
    try {
      const { data, error } = await supabase
        .from('ai_tasks')
        .select('task_type, status, input_tokens, output_tokens, model_used, duration_ms')
        .eq('evaluation_project_id', evaluationProjectId);

      if (error) {
        console.error('AIService.getUsageStats error:', error);
        throw error;
      }

      // Calculate statistics
      const tasks = data || [];
      const stats = {
        total_tasks: tasks.length,
        by_type: {},
        by_status: {},
        total_input_tokens: 0,
        total_output_tokens: 0,
        total_duration_ms: 0,
        estimated_cost_usd: 0
      };

      // Token costs (per 1M tokens)
      const TOKEN_COSTS = {
        input: 3.00,
        output: 15.00
      };

      tasks.forEach(task => {
        // Count by type
        stats.by_type[task.task_type] = (stats.by_type[task.task_type] || 0) + 1;
        
        // Count by status
        stats.by_status[task.status] = (stats.by_status[task.status] || 0) + 1;
        
        // Sum tokens
        stats.total_input_tokens += task.input_tokens || 0;
        stats.total_output_tokens += task.output_tokens || 0;
        
        // Sum duration
        stats.total_duration_ms += task.duration_ms || 0;
      });

      // Calculate estimated cost
      stats.estimated_cost_usd = 
        (stats.total_input_tokens * TOKEN_COSTS.input / 1000000) +
        (stats.total_output_tokens * TOKEN_COSTS.output / 1000000);

      return stats;
    } catch (error) {
      console.error('AIService.getUsageStats failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // IMPORT FUNCTIONS
  // ============================================================================

  /**
   * Import requirements from AI-parsed results
   * 
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {string} userId - User UUID
   * @param {Array} requirements - Array of requirements to import
   * @param {string} sourceDocumentId - Source document UUID
   * @param {Array} categories - Available categories for matching
   * @returns {Promise<Object>} Import result with created requirements
   */
  async importParsedRequirements(evaluationProjectId, userId, requirements, sourceDocumentId, categories = []) {
    try {
      // Create category lookup map
      const categoryMap = {};
      categories.forEach(cat => {
        categoryMap[cat.name.toLowerCase()] = cat.id;
      });

      // Prepare requirements for insertion
      const toInsert = requirements.map((req, index) => {
        // Try to match category
        let categoryId = null;
        if (req.category_suggestion) {
          const normalizedCat = req.category_suggestion.toLowerCase();
          categoryId = categoryMap[normalizedCat] || null;
        }

        return {
          evaluation_project_id: evaluationProjectId,
          title: req.title,
          description: req.description,
          priority: req.priority || 'should_have',
          status: 'draft',
          source_type: 'ai_parsed',
          source_document_id: sourceDocumentId,
          ai_confidence: req.confidence,
          ai_rationale: req.rationale,
          ai_source_quote: req.source_quote,
          category_id: categoryId,
          raised_by: userId,
          created_at: new Date().toISOString()
        };
      });

      // Insert in batches of 50
      const batchSize = 50;
      const results = {
        successful: [],
        failed: []
      };

      for (let i = 0; i < toInsert.length; i += batchSize) {
        const batch = toInsert.slice(i, i + batchSize);
        
        const { data, error } = await supabase
          .from('requirements')
          .insert(batch)
          .select();

        if (error) {
          console.error('Batch insert error:', error);
          results.failed.push(...batch.map(r => ({ requirement: r, error: error.message })));
        } else {
          results.successful.push(...(data || []));
        }
      }

      return {
        total: requirements.length,
        imported: results.successful.length,
        failed: results.failed.length,
        requirements: results.successful,
        errors: results.failed
      };
    } catch (error) {
      console.error('AIService.importParsedRequirements failed:', error);
      throw error;
    }
  }

  /**
   * Add gap analysis suggestions as requirements
   * 
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {string} userId - User UUID
   * @param {Array} suggestions - Array of suggested requirements
   * @param {Array} categories - Available categories for matching
   * @returns {Promise<Object>} Import result
   */
  async addGapSuggestions(evaluationProjectId, userId, suggestions, categories = []) {
    try {
      // Create category lookup map
      const categoryMap = {};
      categories.forEach(cat => {
        categoryMap[cat.name.toLowerCase()] = cat.id;
      });

      // Prepare requirements for insertion
      const toInsert = suggestions.map(sug => {
        // Try to match category
        let categoryId = null;
        if (sug.category_suggestion) {
          const normalizedCat = sug.category_suggestion.toLowerCase();
          categoryId = categoryMap[normalizedCat] || null;
        }

        return {
          evaluation_project_id: evaluationProjectId,
          title: sug.title,
          description: sug.description,
          priority: sug.priority || 'should_have',
          status: 'draft',
          source_type: 'ai_gap_analysis',
          ai_confidence: sug.confidence,
          ai_rationale: `Gap Addressed: ${sug.gap_addressed}\n\nRationale: ${sug.rationale}`,
          category_id: categoryId,
          raised_by: userId,
          created_at: new Date().toISOString()
        };
      });

      // Insert
      const { data, error } = await supabase
        .from('requirements')
        .insert(toInsert)
        .select();

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }

      return {
        total: suggestions.length,
        imported: (data || []).length,
        requirements: data || []
      };
    } catch (error) {
      console.error('AIService.addGapSuggestions failed:', error);
      throw error;
    }
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const aiService = new AIService();
export { AIService };
