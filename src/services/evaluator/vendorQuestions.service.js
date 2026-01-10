/**
 * Vendor Questions Service
 * 
 * Handles all vendor question-related data operations for the Evaluator tool.
 * Questions are sent to vendors for responses during the RFP process.
 * Questions can be linked to requirements and evaluation criteria.
 * 
 * @version 1.0
 * @created 03 January 2026
 * @phase Phase 5 - Vendor Management (Task 5B.1)
 */

import { EvaluatorBaseService } from './base.evaluator.service';
import { supabase } from '../../lib/supabase';

/**
 * Question types - aligned with database migration
 * Migration: 202601010012_create_vendor_questions_responses.sql
 */
export const QUESTION_TYPES = {
  TEXT: 'text',
  TEXTAREA: 'textarea',        // Was 'long_text'
  YES_NO: 'yes_no',
  MULTIPLE_CHOICE: 'multiple_choice',  // Single select from options
  MULTI_SELECT: 'multi_select',        // Multiple select from options
  NUMBER: 'number',
  DATE: 'date',
  FILE_UPLOAD: 'file_upload',
  COMPLIANCE: 'compliance'     // Compliance level response
};

export const QUESTION_TYPE_CONFIG = {
  [QUESTION_TYPES.TEXT]: {
    label: 'Short Text',
    icon: 'Type',
    description: 'Single line text response',
    hasOptions: false
  },
  [QUESTION_TYPES.TEXTAREA]: {
    label: 'Long Text',
    icon: 'AlignLeft',
    description: 'Multi-line text response',
    hasOptions: false
  },
  [QUESTION_TYPES.MULTIPLE_CHOICE]: {
    label: 'Single Choice',
    icon: 'CircleDot',
    description: 'Select one option from a list',
    hasOptions: true
  },
  [QUESTION_TYPES.MULTI_SELECT]: {
    label: 'Multiple Choice',
    icon: 'CheckSquare',
    description: 'Select multiple options from a list',
    hasOptions: true
  },
  [QUESTION_TYPES.YES_NO]: {
    label: 'Yes/No',
    icon: 'ToggleLeft',
    description: 'Simple yes or no response',
    hasOptions: false
  },
  [QUESTION_TYPES.FILE_UPLOAD]: {
    label: 'File Upload',
    icon: 'Upload',
    description: 'Request a file attachment',
    hasOptions: false
  },
  [QUESTION_TYPES.DATE]: {
    label: 'Date',
    icon: 'Calendar',
    description: 'Date picker response',
    hasOptions: false
  },
  [QUESTION_TYPES.NUMBER]: {
    label: 'Number',
    icon: 'Hash',
    description: 'Numeric response',
    hasOptions: false
  },
  [QUESTION_TYPES.COMPLIANCE]: {
    label: 'Compliance',
    icon: 'Shield',
    description: 'Compliance level assessment',
    hasOptions: false
  }
};

/**
 * Question categories/sections for grouping
 */
export const QUESTION_SECTIONS = {
  COMPANY_INFO: 'company_info',
  PRODUCT_CAPABILITY: 'product_capability',
  TECHNICAL: 'technical',
  IMPLEMENTATION: 'implementation',
  SUPPORT: 'support',
  PRICING: 'pricing',
  REFERENCES: 'references',
  COMPLIANCE: 'compliance',
  OTHER: 'other'
};

export const QUESTION_SECTION_CONFIG = {
  [QUESTION_SECTIONS.COMPANY_INFO]: {
    label: 'Company Information',
    description: 'General company background and credentials',
    order: 1
  },
  [QUESTION_SECTIONS.PRODUCT_CAPABILITY]: {
    label: 'Product Capabilities',
    description: 'Features and functionality',
    order: 2
  },
  [QUESTION_SECTIONS.TECHNICAL]: {
    label: 'Technical',
    description: 'Architecture, integrations, security',
    order: 3
  },
  [QUESTION_SECTIONS.IMPLEMENTATION]: {
    label: 'Implementation',
    description: 'Deployment, migration, timeline',
    order: 4
  },
  [QUESTION_SECTIONS.SUPPORT]: {
    label: 'Support & Training',
    description: 'SLAs, support model, training',
    order: 5
  },
  [QUESTION_SECTIONS.PRICING]: {
    label: 'Pricing',
    description: 'Licensing, costs, terms',
    order: 6
  },
  [QUESTION_SECTIONS.REFERENCES]: {
    label: 'References',
    description: 'Customer references and case studies',
    order: 7
  },
  [QUESTION_SECTIONS.COMPLIANCE]: {
    label: 'Compliance & Security',
    description: 'Certifications, audits, data handling',
    order: 8
  },
  [QUESTION_SECTIONS.OTHER]: {
    label: 'Other',
    description: 'Additional questions',
    order: 9
  }
};

export class VendorQuestionsService extends EvaluatorBaseService {
  constructor() {
    super('vendor_questions', {
      supportsSoftDelete: true,
      sanitizeConfig: 'question'
    });
  }

  // ============================================================================
  // QUESTION CRUD OPERATIONS
  // ============================================================================

  /**
   * Get all questions for an evaluation project
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of questions with related data
   */
  async getAllWithDetails(evaluationProjectId, options = {}) {
    try {
      // First get questions
      let query = supabase
        .from('vendor_questions')
        .select('*')
        .eq('evaluation_project_id', evaluationProjectId)
        .or('is_deleted.is.null,is_deleted.eq.false');

      // Apply section filter
      if (options.section) {
        query = query.eq('section', options.section);
      }

      // Apply type filter
      if (options.questionType) {
        query = query.eq('question_type', options.questionType);
      }

      // Apply required filter
      if (options.required !== undefined) {
        query = query.eq('is_required', options.required);
      }

      // Apply search (use guidance_for_vendors instead of help_text)
      if (options.search) {
        query = query.or(`question_text.ilike.%${options.search}%,guidance_for_vendors.ilike.%${options.search}%`);
      }

      // Order by section and then sort_order (not display_order)
      query = query.order('section').order('sort_order');

      const { data: questions, error } = await query;

      if (error) {
        console.error('VendorQuestionsService getAllWithDetails error:', error);
        throw error;
      }

      if (!questions || questions.length === 0) {
        return [];
      }

      // Get linked requirements and criteria via junction table
      const questionIds = questions.map(q => q.id);
      const { data: links, error: linksError } = await supabase
        .from('vendor_question_links')
        .select(`
          question_id,
          requirement_id,
          criterion_id,
          requirement:requirement_id(id, reference_code, title),
          criterion:criterion_id(id, name, category_id)
        `)
        .in('question_id', questionIds);

      if (linksError) {
        console.error('VendorQuestionsService getAllWithDetails links error:', linksError);
        // Don't fail - just return questions without links
      }

      // Build links map
      const linksMap = {};
      (links || []).forEach(link => {
        if (!linksMap[link.question_id]) {
          linksMap[link.question_id] = { requirements: [], criteria: [] };
        }
        if (link.requirement) {
          linksMap[link.question_id].requirements.push(link.requirement);
        }
        if (link.criterion) {
          linksMap[link.question_id].criteria.push(link.criterion);
        }
      });

      return questions.map(q => ({
        ...q,
        // Map guidance_for_vendors to help_text for UI compatibility
        help_text: q.guidance_for_vendors,
        // Map sort_order to display_order for UI compatibility
        display_order: q.sort_order,
        typeConfig: QUESTION_TYPE_CONFIG[q.question_type] || {},
        sectionConfig: QUESTION_SECTION_CONFIG[q.section] || {},
        linked_requirements: linksMap[q.id]?.requirements || [],
        linked_criteria: linksMap[q.id]?.criteria || []
      }));
    } catch (error) {
      console.error('VendorQuestionsService getAllWithDetails failed:', error);
      throw error;
    }
  }

  /**
   * Get questions grouped by section
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Object>} Questions grouped by section
   */
  async getBySection(evaluationProjectId) {
    try {
      const questions = await this.getAllWithDetails(evaluationProjectId);

      // Initialize all sections
      const grouped = {};
      Object.keys(QUESTION_SECTION_CONFIG).forEach(section => {
        grouped[section] = {
          ...QUESTION_SECTION_CONFIG[section],
          key: section,
          questions: []
        };
      });

      // Group questions
      questions.forEach(q => {
        const section = q.section || QUESTION_SECTIONS.OTHER;
        if (grouped[section]) {
          grouped[section].questions.push(q);
        }
      });

      // Convert to array and sort by order
      return Object.values(grouped)
        .sort((a, b) => a.order - b.order)
        .filter(section => section.questions.length > 0 || section.key !== QUESTION_SECTIONS.OTHER);
    } catch (error) {
      console.error('VendorQuestionsService getBySection failed:', error);
      throw error;
    }
  }

  /**
   * Get a single question by ID
   * @param {string} questionId - Question UUID
   * @returns {Promise<Object|null>} Question with details
   */
  async getByIdWithDetails(questionId) {
    try {
      const { data, error } = await supabase
        .from('vendor_questions')
        .select('*')
        .eq('id', questionId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .limit(1);

      if (error) throw error;
      if (!data?.[0]) return null;

      const question = data[0];

      // Get linked requirements and criteria via junction table
      const { data: links, error: linksError } = await supabase
        .from('vendor_question_links')
        .select(`
          requirement_id,
          criterion_id,
          requirement:requirement_id(id, reference_code, title, description),
          criterion:criterion_id(id, name, category_id, weight)
        `)
        .eq('question_id', questionId);

      if (linksError) {
        console.error('VendorQuestionsService getByIdWithDetails links error:', linksError);
      }

      const linkedRequirements = [];
      const linkedCriteria = [];
      (links || []).forEach(link => {
        if (link.requirement) linkedRequirements.push(link.requirement);
        if (link.criterion) linkedCriteria.push(link.criterion);
      });

      return {
        ...question,
        // Map guidance_for_vendors to help_text for UI compatibility
        help_text: question.guidance_for_vendors,
        // Map sort_order to display_order for UI compatibility
        display_order: question.sort_order,
        typeConfig: QUESTION_TYPE_CONFIG[question.question_type] || {},
        sectionConfig: QUESTION_SECTION_CONFIG[question.section] || {},
        linked_requirements: linkedRequirements,
        linked_criteria: linkedCriteria
      };
    } catch (error) {
      console.error('VendorQuestionsService getByIdWithDetails failed:', error);
      throw error;
    }
  }

  /**
   * Create a new question
   * @param {Object} questionData - Question data
   * @returns {Promise<Object>} Created question
   */
  async createQuestion(questionData) {
    try {
      if (!questionData.evaluation_project_id) {
        throw new Error('evaluation_project_id is required');
      }
      if (!questionData.question_text) {
        throw new Error('question_text is required');
      }

      // Get next sort_order for section (not display_order)
      const { data: existing } = await supabase
        .from('vendor_questions')
        .select('sort_order')
        .eq('evaluation_project_id', questionData.evaluation_project_id)
        .eq('section', questionData.section || QUESTION_SECTIONS.OTHER)
        .order('sort_order', { ascending: false })
        .limit(1);

      const nextOrder = (existing?.[0]?.sort_order || 0) + 1;

      // Map question type if using old names
      let questionType = questionData.question_type || QUESTION_TYPES.TEXT;
      if (questionType === 'long_text') questionType = QUESTION_TYPES.TEXTAREA;
      if (questionType === 'single_choice') questionType = QUESTION_TYPES.MULTIPLE_CHOICE;
      if (questionType === 'rating') questionType = QUESTION_TYPES.NUMBER;

      const dataToCreate = {
        evaluation_project_id: questionData.evaluation_project_id,
        question_text: questionData.question_text,
        question_type: questionType,
        section: questionData.section || QUESTION_SECTIONS.OTHER,
        guidance_for_vendors: questionData.help_text || questionData.guidance_for_vendors || null,
        is_required: questionData.is_required ?? true,
        options: questionData.options || null,
        sort_order: questionData.display_order || questionData.sort_order || nextOrder,
        max_length: questionData.max_length || null,
        scoring_guidance: questionData.scoring_guidance || null
      };

      const newQuestion = await this.create(dataToCreate);

      // Create links via junction table if provided
      if (newQuestion && (questionData.requirement_id || questionData.criterion_id)) {
        const links = [];
        if (questionData.requirement_id) {
          links.push({
            question_id: newQuestion.id,
            requirement_id: questionData.requirement_id,
            criterion_id: null
          });
        }
        if (questionData.criterion_id) {
          links.push({
            question_id: newQuestion.id,
            requirement_id: null,
            criterion_id: questionData.criterion_id
          });
        }
        if (links.length > 0) {
          const { error: linkError } = await supabase
            .from('vendor_question_links')
            .insert(links);
          if (linkError) {
            console.error('VendorQuestionsService createQuestion link error:', linkError);
          }
        }
      }

      // Return with UI-compatible field names
      return {
        ...newQuestion,
        help_text: newQuestion.guidance_for_vendors,
        display_order: newQuestion.sort_order
      };
    } catch (error) {
      console.error('VendorQuestionsService createQuestion failed:', error);
      throw error;
    }
  }

  /**
   * Update a question
   * @param {string} questionId - Question UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated question
   */
  async updateQuestion(questionId, updates) {
    try {
      // Map old field names to new database column names
      const fieldMapping = {
        'help_text': 'guidance_for_vendors',
        'display_order': 'sort_order'
      };

      const allowedDbFields = [
        'question_text', 'question_type', 'section', 'guidance_for_vendors',
        'is_required', 'options', 'sort_order', 'max_length', 'scoring_guidance'
      ];

      const filteredUpdates = {};

      // Process updates with field name mapping
      Object.keys(updates).forEach(field => {
        if (updates[field] !== undefined) {
          const dbField = fieldMapping[field] || field;
          if (allowedDbFields.includes(dbField)) {
            // Map question type if using old names
            if (dbField === 'question_type') {
              let qType = updates[field];
              if (qType === 'long_text') qType = QUESTION_TYPES.TEXTAREA;
              if (qType === 'single_choice') qType = QUESTION_TYPES.MULTIPLE_CHOICE;
              if (qType === 'rating') qType = QUESTION_TYPES.NUMBER;
              filteredUpdates[dbField] = qType;
            } else {
              filteredUpdates[dbField] = updates[field];
            }
          }
        }
      });

      const result = await this.update(questionId, filteredUpdates);

      // Handle requirement/criterion links via junction table
      if (updates.requirement_id !== undefined || updates.criterion_id !== undefined) {
        // Delete existing links
        await supabase
          .from('vendor_question_links')
          .delete()
          .eq('question_id', questionId);

        // Create new links
        const links = [];
        if (updates.requirement_id) {
          links.push({
            question_id: questionId,
            requirement_id: updates.requirement_id,
            criterion_id: null
          });
        }
        if (updates.criterion_id) {
          links.push({
            question_id: questionId,
            requirement_id: null,
            criterion_id: updates.criterion_id
          });
        }
        if (links.length > 0) {
          await supabase
            .from('vendor_question_links')
            .insert(links);
        }
      }

      // Return with UI-compatible field names
      return {
        ...result,
        help_text: result.guidance_for_vendors,
        display_order: result.sort_order
      };
    } catch (error) {
      console.error('VendorQuestionsService updateQuestion failed:', error);
      throw error;
    }
  }

  /**
   * Reorder questions within a section
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {string} section - Section key
   * @param {Array<string>} questionIds - Ordered array of question IDs
   * @returns {Promise<boolean>} Success status
   */
  async reorderQuestions(evaluationProjectId, section, questionIds) {
    try {
      const updates = questionIds.map((id, index) => ({
        id,
        sort_order: index + 1  // Use sort_order, not display_order
      }));

      for (const update of updates) {
        await supabase
          .from('vendor_questions')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id)
          .eq('evaluation_project_id', evaluationProjectId);
      }

      return true;
    } catch (error) {
      console.error('VendorQuestionsService reorderQuestions failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // QUESTION LINKING (via vendor_question_links junction table)
  // ============================================================================

  /**
   * Link question to a requirement
   * @param {string} questionId - Question UUID
   * @param {string} requirementId - Requirement UUID
   * @returns {Promise<Object>} Created link
   */
  async linkToRequirement(questionId, requirementId) {
    try {
      // Check if link already exists
      const { data: existing } = await supabase
        .from('vendor_question_links')
        .select('id')
        .eq('question_id', questionId)
        .eq('requirement_id', requirementId)
        .limit(1);

      if (existing && existing.length > 0) {
        return existing[0]; // Already linked
      }

      const { data, error } = await supabase
        .from('vendor_question_links')
        .insert({
          question_id: questionId,
          requirement_id: requirementId,
          criterion_id: null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('VendorQuestionsService linkToRequirement failed:', error);
      throw error;
    }
  }

  /**
   * Link question to evaluation criterion
   * @param {string} questionId - Question UUID
   * @param {string} criterionId - Criterion UUID
   * @returns {Promise<Object>} Created link
   */
  async linkToCriterion(questionId, criterionId) {
    try {
      // Check if link already exists
      const { data: existing } = await supabase
        .from('vendor_question_links')
        .select('id')
        .eq('question_id', questionId)
        .eq('criterion_id', criterionId)
        .limit(1);

      if (existing && existing.length > 0) {
        return existing[0]; // Already linked
      }

      const { data, error } = await supabase
        .from('vendor_question_links')
        .insert({
          question_id: questionId,
          requirement_id: null,
          criterion_id: criterionId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('VendorQuestionsService linkToCriterion failed:', error);
      throw error;
    }
  }

  /**
   * Unlink question from requirement
   * @param {string} questionId - Question UUID
   * @param {string} requirementId - Requirement UUID (optional - if null, removes all)
   * @returns {Promise<boolean>} Success status
   */
  async unlinkFromRequirement(questionId, requirementId = null) {
    try {
      let query = supabase
        .from('vendor_question_links')
        .delete()
        .eq('question_id', questionId);

      if (requirementId) {
        query = query.eq('requirement_id', requirementId);
      } else {
        query = query.not('requirement_id', 'is', null);
      }

      const { error } = await query;
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('VendorQuestionsService unlinkFromRequirement failed:', error);
      throw error;
    }
  }

  /**
   * Unlink question from criterion
   * @param {string} questionId - Question UUID
   * @param {string} criterionId - Criterion UUID (optional - if null, removes all)
   * @returns {Promise<boolean>} Success status
   */
  async unlinkFromCriterion(questionId, criterionId = null) {
    try {
      let query = supabase
        .from('vendor_question_links')
        .delete()
        .eq('question_id', questionId);

      if (criterionId) {
        query = query.eq('criterion_id', criterionId);
      } else {
        query = query.not('criterion_id', 'is', null);
      }

      const { error } = await query;
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('VendorQuestionsService unlinkFromCriterion failed:', error);
      throw error;
    }
  }

  /**
   * Get all links for a question
   * @param {string} questionId - Question UUID
   * @returns {Promise<Object>} Object with requirements and criteria arrays
   */
  async getQuestionLinks(questionId) {
    try {
      const { data: links, error } = await supabase
        .from('vendor_question_links')
        .select(`
          id,
          requirement:requirement_id(id, reference_code, title),
          criterion:criterion_id(id, name, category_id)
        `)
        .eq('question_id', questionId);

      if (error) throw error;

      const requirements = [];
      const criteria = [];
      (links || []).forEach(link => {
        if (link.requirement) requirements.push(link.requirement);
        if (link.criterion) criteria.push(link.criterion);
      });

      return { requirements, criteria };
    } catch (error) {
      console.error('VendorQuestionsService getQuestionLinks failed:', error);
      throw error;
    }
  }

  /**
   * Update all links for a question (replace existing)
   * @param {string} questionId - Question UUID
   * @param {Array<string>} requirementIds - Requirement UUIDs
   * @param {Array<string>} criterionIds - Criterion UUIDs
   * @returns {Promise<boolean>} Success status
   */
  async updateQuestionLinks(questionId, requirementIds = [], criterionIds = []) {
    try {
      // Delete all existing links
      await supabase
        .from('vendor_question_links')
        .delete()
        .eq('question_id', questionId);

      // Create new links
      const links = [];
      requirementIds.forEach(reqId => {
        links.push({
          question_id: questionId,
          requirement_id: reqId,
          criterion_id: null
        });
      });
      criterionIds.forEach(critId => {
        links.push({
          question_id: questionId,
          requirement_id: null,
          criterion_id: critId
        });
      });

      if (links.length > 0) {
        const { error } = await supabase
          .from('vendor_question_links')
          .insert(links);
        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('VendorQuestionsService updateQuestionLinks failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // VENDOR RESPONSES
  // ============================================================================

  /**
   * Get all responses for a vendor
   * @param {string} vendorId - Vendor UUID
   * @returns {Promise<Array>} Array of responses with question details
   */
  async getVendorResponses(vendorId) {
    try {
      const { data, error } = await supabase
        .from('vendor_responses')
        .select(`
          *,
          question:question_id(
            id, question_text, question_type, section, is_required, options
          )
        `)
        .eq('vendor_id', vendorId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('VendorQuestionsService getVendorResponses failed:', error);
      throw error;
    }
  }

  /**
   * Get questions with vendor's responses
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {string} vendorId - Vendor UUID
   * @returns {Promise<Array>} Questions with responses attached
   */
  async getQuestionsWithResponses(evaluationProjectId, vendorId) {
    try {
      // Get all questions
      const questions = await this.getAllWithDetails(evaluationProjectId);

      // Get vendor responses
      const { data: responses, error } = await supabase
        .from('vendor_responses')
        .select('*')
        .eq('vendor_id', vendorId);

      if (error) throw error;

      // Map responses to questions
      const responseMap = {};
      (responses || []).forEach(r => {
        responseMap[r.question_id] = r;
      });

      return questions.map(q => ({
        ...q,
        response: responseMap[q.id] || null
      }));
    } catch (error) {
      console.error('VendorQuestionsService getQuestionsWithResponses failed:', error);
      throw error;
    }
  }

  /**
   * Save or update a vendor response
   * @param {string} vendorId - Vendor UUID
   * @param {string} questionId - Question UUID
   * @param {Object} responseData - Response data
   * @returns {Promise<Object>} Created/updated response
   */
  async saveResponse(vendorId, questionId, responseData) {
    try {
      // Check if response exists
      const { data: existing } = await supabase
        .from('vendor_responses')
        .select('id')
        .eq('vendor_id', vendorId)
        .eq('question_id', questionId)
        .limit(1);

      const dataToSave = {
        vendor_id: vendorId,
        question_id: questionId,
        response_text: responseData.response_text || null,
        response_data: responseData.response_data || null, // JSONB for structured responses
        file_url: responseData.file_url || null,
        responded_at: new Date().toISOString(),
        responded_by: responseData.responded_by || null
      };

      if (existing?.[0]) {
        // Update
        const { data, error } = await supabase
          .from('vendor_responses')
          .update(dataToSave)
          .eq('id', existing[0].id)
          .select();

        if (error) throw error;
        return data?.[0];
      } else {
        // Insert
        const { data, error } = await supabase
          .from('vendor_responses')
          .insert(dataToSave)
          .select();

        if (error) throw error;
        return data?.[0];
      }
    } catch (error) {
      console.error('VendorQuestionsService saveResponse failed:', error);
      throw error;
    }
  }

  /**
   * Save multiple responses at once
   * @param {string} vendorId - Vendor UUID
   * @param {Array<Object>} responses - Array of {questionId, ...responseData}
   * @returns {Promise<Array>} Saved responses
   */
  async saveResponses(vendorId, responses) {
    try {
      const results = [];
      for (const response of responses) {
        const saved = await this.saveResponse(
          vendorId,
          response.questionId,
          response
        );
        results.push(saved);
      }
      return results;
    } catch (error) {
      console.error('VendorQuestionsService saveResponses failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // STATISTICS & REPORTING
  // ============================================================================

  /**
   * Get response progress for a vendor
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {string} vendorId - Vendor UUID
   * @returns {Promise<Object>} Progress statistics
   */
  async getResponseProgress(evaluationProjectId, vendorId) {
    try {
      const questionsWithResponses = await this.getQuestionsWithResponses(
        evaluationProjectId,
        vendorId
      );

      const total = questionsWithResponses.length;
      const required = questionsWithResponses.filter(q => q.is_required).length;
      const answered = questionsWithResponses.filter(q => q.response).length;
      const requiredAnswered = questionsWithResponses.filter(
        q => q.is_required && q.response
      ).length;

      // Group by section
      const bySection = {};
      questionsWithResponses.forEach(q => {
        const section = q.section || QUESTION_SECTIONS.OTHER;
        if (!bySection[section]) {
          bySection[section] = {
            total: 0,
            answered: 0,
            required: 0,
            requiredAnswered: 0
          };
        }
        bySection[section].total++;
        if (q.response) bySection[section].answered++;
        if (q.is_required) bySection[section].required++;
        if (q.is_required && q.response) bySection[section].requiredAnswered++;
      });

      return {
        total,
        required,
        answered,
        requiredAnswered,
        percentComplete: total > 0 ? Math.round((answered / total) * 100) : 0,
        percentRequiredComplete: required > 0 
          ? Math.round((requiredAnswered / required) * 100) 
          : 100,
        isComplete: requiredAnswered >= required,
        bySection
      };
    } catch (error) {
      console.error('VendorQuestionsService getResponseProgress failed:', error);
      throw error;
    }
  }

  /**
   * Get summary statistics for questions
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Object>} Question statistics
   */
  async getSummary(evaluationProjectId) {
    try {
      const questions = await this.getAllWithDetails(evaluationProjectId);

      const bySection = {};
      const byType = {};
      let linkedToRequirements = 0;
      let linkedToCriteria = 0;
      let required = 0;

      questions.forEach(q => {
        // By section
        const section = q.section || QUESTION_SECTIONS.OTHER;
        bySection[section] = (bySection[section] || 0) + 1;

        // By type
        byType[q.question_type] = (byType[q.question_type] || 0) + 1;

        // Links
        if (q.requirement_id) linkedToRequirements++;
        if (q.criterion_id) linkedToCriteria++;

        // Required
        if (q.is_required) required++;
      });

      return {
        total: questions.length,
        required,
        optional: questions.length - required,
        linkedToRequirements,
        linkedToCriteria,
        bySection,
        byType
      };
    } catch (error) {
      console.error('VendorQuestionsService getSummary failed:', error);
      throw error;
    }
  }

  /**
   * Get comparison of vendor responses
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {Array<string>} vendorIds - Array of vendor UUIDs to compare
   * @returns {Promise<Array>} Questions with all vendor responses
   */
  async compareVendorResponses(evaluationProjectId, vendorIds) {
    try {
      const questions = await this.getAllWithDetails(evaluationProjectId);

      // Get all responses for these vendors
      const { data: responses, error } = await supabase
        .from('vendor_responses')
        .select('*')
        .in('vendor_id', vendorIds);

      if (error) throw error;

      // Build response map: questionId -> vendorId -> response
      const responseMap = {};
      (responses || []).forEach(r => {
        if (!responseMap[r.question_id]) {
          responseMap[r.question_id] = {};
        }
        responseMap[r.question_id][r.vendor_id] = r;
      });

      // Attach responses to questions
      return questions.map(q => ({
        ...q,
        vendorResponses: vendorIds.reduce((acc, vendorId) => {
          acc[vendorId] = responseMap[q.id]?.[vendorId] || null;
          return acc;
        }, {})
      }));
    } catch (error) {
      console.error('VendorQuestionsService compareVendorResponses failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const vendorQuestionsService = new VendorQuestionsService();
export default vendorQuestionsService;
