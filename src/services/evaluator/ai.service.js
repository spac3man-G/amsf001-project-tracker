/**
 * AI Service
 * 
 * Handles AI operations for the Evaluator tool including:
 * - Document parsing for requirements extraction
 * - Gap analysis
 * - Requirement suggestions
 * 
 * @version 1.0
 * @created January 4, 2026
 * @phase Phase 8A - Document Parsing & Gap Analysis
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
