/**
 * Surveys Service
 * 
 * Handles all survey-related data operations for the Evaluator tool.
 * Surveys can be standalone, pre-workshop prep, or post-workshop validation.
 * Supports multiple question types and tracks response status.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 4 - Input Capture (Task 4B.1)
 */

import { EvaluatorBaseService } from './base.evaluator.service';
import { supabase } from '../../lib/supabase';

/**
 * Survey types
 */
export const SURVEY_TYPES = {
  STANDALONE: 'standalone',
  PRE_WORKSHOP: 'pre_workshop',
  POST_WORKSHOP: 'post_workshop',
  VENDOR_RFP: 'vendor_rfp'
};

export const SURVEY_TYPE_CONFIG = {
  [SURVEY_TYPES.STANDALONE]: {
    label: 'Standalone Survey',
    description: 'Independent survey not linked to a workshop',
    icon: 'ClipboardList'
  },
  [SURVEY_TYPES.PRE_WORKSHOP]: {
    label: 'Pre-Workshop',
    description: 'Preparation survey sent before a workshop',
    icon: 'FileText'
  },
  [SURVEY_TYPES.POST_WORKSHOP]: {
    label: 'Post-Workshop',
    description: 'Follow-up validation survey after a workshop',
    icon: 'CheckSquare'
  },
  [SURVEY_TYPES.VENDOR_RFP]: {
    label: 'Vendor RFP',
    description: 'Request for proposal sent to vendors',
    icon: 'Send'
  }
};

/**
 * Survey status workflow
 */
export const SURVEY_STATUSES = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  CLOSED: 'closed',
  ARCHIVED: 'archived'
};

export const SURVEY_STATUS_CONFIG = {
  [SURVEY_STATUSES.DRAFT]: {
    label: 'Draft',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    description: 'Survey is being created'
  },
  [SURVEY_STATUSES.ACTIVE]: {
    label: 'Active',
    color: '#10B981',
    bgColor: '#D1FAE5',
    description: 'Survey is accepting responses'
  },
  [SURVEY_STATUSES.CLOSED]: {
    label: 'Closed',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    description: 'Survey is no longer accepting responses'
  },
  [SURVEY_STATUSES.ARCHIVED]: {
    label: 'Archived',
    color: '#9CA3AF',
    bgColor: '#F3F4F6',
    description: 'Survey has been archived'
  }
};

/**
 * Question types supported by the survey builder
 */
export const QUESTION_TYPES = {
  TEXT: 'text',
  TEXTAREA: 'textarea',
  NUMBER: 'number',
  SELECT: 'select',
  MULTISELECT: 'multiselect',
  RATING: 'rating',
  YES_NO: 'yes_no',
  FILE: 'file'
};

export const QUESTION_TYPE_CONFIG = {
  [QUESTION_TYPES.TEXT]: {
    label: 'Short Text',
    description: 'Single line text input',
    icon: 'Type',
    hasOptions: false
  },
  [QUESTION_TYPES.TEXTAREA]: {
    label: 'Long Text',
    description: 'Multi-line text input',
    icon: 'AlignLeft',
    hasOptions: false
  },
  [QUESTION_TYPES.NUMBER]: {
    label: 'Number',
    description: 'Numeric input',
    icon: 'Hash',
    hasOptions: false
  },
  [QUESTION_TYPES.SELECT]: {
    label: 'Single Choice',
    description: 'Select one option from a list',
    icon: 'CircleDot',
    hasOptions: true
  },
  [QUESTION_TYPES.MULTISELECT]: {
    label: 'Multiple Choice',
    description: 'Select multiple options',
    icon: 'CheckSquare',
    hasOptions: true
  },
  [QUESTION_TYPES.RATING]: {
    label: 'Rating Scale',
    description: 'Rate on a numeric scale (1-5)',
    icon: 'Star',
    hasOptions: false
  },
  [QUESTION_TYPES.YES_NO]: {
    label: 'Yes/No',
    description: 'Simple yes or no question',
    icon: 'ToggleLeft',
    hasOptions: false
  },
  [QUESTION_TYPES.FILE]: {
    label: 'File Upload',
    description: 'Allow file attachment',
    icon: 'Upload',
    hasOptions: false
  }
};

/**
 * Response status
 */
export const RESPONSE_STATUSES = {
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted'
};


export class SurveysService extends EvaluatorBaseService {
  constructor() {
    super('surveys', {
      supportsSoftDelete: true,
      sanitizeConfig: 'survey'
    });
  }

  // ============================================================================
  // SURVEY CRUD OPERATIONS
  // ============================================================================

  /**
   * Get all surveys with response counts
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of surveys with stats
   */
  async getAllWithDetails(evaluationProjectId, options = {}) {
    try {
      let query = supabase
        .from('surveys')
        .select(`
          *,
          created_by_profile:profiles!created_by(id, full_name, email),
          linked_workshop:workshops(id, name, scheduled_date, status),
          responses:survey_responses(id, status)
        `)
        .eq('evaluation_project_id', evaluationProjectId)
        .or('is_deleted.is.null,is_deleted.eq.false');

      // Apply type filter
      if (options.type) {
        if (Array.isArray(options.type)) {
          query = query.in('type', options.type);
        } else {
          query = query.eq('type', options.type);
        }
      }

      // Apply status filter
      if (options.status) {
        if (Array.isArray(options.status)) {
          query = query.in('status', options.status);
        } else {
          query = query.eq('status', options.status);
        }
      }

      // Apply workshop filter
      if (options.workshopId) {
        query = query.eq('linked_workshop_id', options.workshopId);
      }

      // Apply search filter
      if (options.search) {
        query = query.or(`name.ilike.%${options.search}%,description.ilike.%${options.search}%`);
      }

      // Apply ordering
      const orderColumn = options.orderBy?.column || 'created_at';
      const orderAscending = options.orderBy?.ascending ?? false;
      query = query.order(orderColumn, { ascending: orderAscending });

      const { data, error } = await query;

      if (error) {
        console.error('SurveysService getAllWithDetails error:', error);
        throw error;
      }

      // Compute response counts
      const surveys = (data || []).map(survey => ({
        ...survey,
        questionCount: survey.questions?.length || 0,
        responseCount: survey.responses?.length || 0,
        submittedCount: survey.responses?.filter(r => r.status === 'submitted').length || 0,
        inProgressCount: survey.responses?.filter(r => r.status === 'in_progress').length || 0
      }));

      return surveys;
    } catch (error) {
      console.error('SurveysService getAllWithDetails failed:', error);
      throw error;
    }
  }

  /**
   * Get a single survey by ID with full details
   * @param {string} surveyId - Survey UUID
   * @returns {Promise<Object|null>} Survey with full details
   */
  async getByIdWithDetails(surveyId) {
    try {
      const { data, error } = await supabase
        .from('surveys')
        .select(`
          *,
          created_by_profile:profiles!created_by(id, full_name, email),
          linked_workshop:workshops(id, name, scheduled_date, status),
          responses:survey_responses(
            id, status, submitted_at, created_at,
            respondent:profiles(id, full_name, email, avatar_url),
            respondent_email, respondent_name
          )
        `)
        .eq('id', surveyId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .limit(1);

      if (error) {
        console.error('SurveysService getByIdWithDetails error:', error);
        throw error;
      }

      const survey = data?.[0];
      if (survey) {
        survey.questionCount = survey.questions?.length || 0;
        survey.responseCount = survey.responses?.length || 0;
        survey.submittedCount = survey.responses?.filter(r => r.status === 'submitted').length || 0;
      }

      return survey || null;
    } catch (error) {
      console.error('SurveysService getByIdWithDetails failed:', error);
      throw error;
    }
  }

  /**
   * Create a new survey
   * @param {Object} surveyData - Survey data
   * @returns {Promise<Object>} Created survey
   */
  async createSurvey(surveyData) {
    try {
      if (!surveyData.evaluation_project_id) {
        throw new Error('evaluation_project_id is required');
      }
      if (!surveyData.name) {
        throw new Error('name is required');
      }

      const dataToCreate = {
        evaluation_project_id: surveyData.evaluation_project_id,
        name: surveyData.name,
        description: surveyData.description || null,
        instructions: surveyData.instructions || null,
        type: surveyData.type || SURVEY_TYPES.STANDALONE,
        linked_workshop_id: surveyData.linked_workshop_id || null,
        status: surveyData.status || SURVEY_STATUSES.DRAFT,
        questions: surveyData.questions || [],
        allow_anonymous: surveyData.allow_anonymous || false,
        allow_multiple_responses: surveyData.allow_multiple_responses || false,
        closes_at: surveyData.closes_at || null,
        created_by: surveyData.created_by || null
      };

      return this.create(dataToCreate);
    } catch (error) {
      console.error('SurveysService createSurvey failed:', error);
      throw error;
    }
  }


  /**
   * Update a survey
   * @param {string} surveyId - Survey UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated survey
   */
  async updateSurvey(surveyId, updates) {
    try {
      // Validate status transition if status is being changed
      if (updates.status) {
        const current = await this.getById(surveyId);
        if (!current) {
          throw new Error('Survey not found');
        }
        if (!this.isValidStatusTransition(current.status, updates.status)) {
          throw new Error(`Cannot transition from ${current.status} to ${updates.status}`);
        }
      }

      const allowedFields = [
        'name', 'description', 'instructions',
        'type', 'linked_workshop_id',
        'status', 'questions',
        'allow_anonymous', 'allow_multiple_responses',
        'closes_at'
      ];

      const filteredUpdates = {};
      allowedFields.forEach(field => {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      });

      return this.update(surveyId, filteredUpdates);
    } catch (error) {
      console.error('SurveysService updateSurvey failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // STATUS MANAGEMENT
  // ============================================================================

  /**
   * Check if status transition is valid
   */
  isValidStatusTransition(fromStatus, toStatus) {
    const validTransitions = {
      [SURVEY_STATUSES.DRAFT]: [SURVEY_STATUSES.ACTIVE, SURVEY_STATUSES.ARCHIVED],
      [SURVEY_STATUSES.ACTIVE]: [SURVEY_STATUSES.CLOSED, SURVEY_STATUSES.DRAFT],
      [SURVEY_STATUSES.CLOSED]: [SURVEY_STATUSES.ACTIVE, SURVEY_STATUSES.ARCHIVED],
      [SURVEY_STATUSES.ARCHIVED]: [SURVEY_STATUSES.DRAFT]
    };

    return validTransitions[fromStatus]?.includes(toStatus) ?? false;
  }

  /**
   * Activate a survey (make it available for responses)
   */
  async activate(surveyId) {
    return this.update(surveyId, { status: SURVEY_STATUSES.ACTIVE });
  }

  /**
   * Close a survey (stop accepting responses)
   */
  async close(surveyId) {
    return this.update(surveyId, { status: SURVEY_STATUSES.CLOSED });
  }

  /**
   * Archive a survey
   */
  async archive(surveyId) {
    return this.update(surveyId, { status: SURVEY_STATUSES.ARCHIVED });
  }

  // ============================================================================
  // QUESTION MANAGEMENT
  // ============================================================================

  /**
   * Generate a unique question ID
   */
  generateQuestionId() {
    return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add a question to a survey
   */
  async addQuestion(surveyId, questionData) {
    try {
      const survey = await this.getById(surveyId);
      if (!survey) throw new Error('Survey not found');

      const questions = [...(survey.questions || [])];
      const newQuestion = {
        id: this.generateQuestionId(),
        type: questionData.type || QUESTION_TYPES.TEXT,
        text: questionData.text || '',
        required: questionData.required ?? false,
        options: questionData.options || [],
        validation: questionData.validation || {},
        order: questions.length
      };

      questions.push(newQuestion);
      return this.update(surveyId, { questions });
    } catch (error) {
      console.error('SurveysService addQuestion failed:', error);
      throw error;
    }
  }

  /**
   * Update a question in a survey
   */
  async updateQuestion(surveyId, questionId, updates) {
    try {
      const survey = await this.getById(surveyId);
      if (!survey) throw new Error('Survey not found');

      const questions = (survey.questions || []).map(q => {
        if (q.id === questionId) {
          return { ...q, ...updates };
        }
        return q;
      });

      return this.update(surveyId, { questions });
    } catch (error) {
      console.error('SurveysService updateQuestion failed:', error);
      throw error;
    }
  }

  /**
   * Remove a question from a survey
   */
  async removeQuestion(surveyId, questionId) {
    try {
      const survey = await this.getById(surveyId);
      if (!survey) throw new Error('Survey not found');

      const questions = (survey.questions || [])
        .filter(q => q.id !== questionId)
        .map((q, idx) => ({ ...q, order: idx }));

      return this.update(surveyId, { questions });
    } catch (error) {
      console.error('SurveysService removeQuestion failed:', error);
      throw error;
    }
  }

  /**
   * Reorder questions in a survey
   */
  async reorderQuestions(surveyId, questionIds) {
    try {
      const survey = await this.getById(surveyId);
      if (!survey) throw new Error('Survey not found');

      const questionsMap = {};
      (survey.questions || []).forEach(q => { questionsMap[q.id] = q; });

      const questions = questionIds.map((id, idx) => ({
        ...questionsMap[id],
        order: idx
      }));

      return this.update(surveyId, { questions });
    } catch (error) {
      console.error('SurveysService reorderQuestions failed:', error);
      throw error;
    }
  }


  // ============================================================================
  // POST-WORKSHOP FOLLOW-UP SURVEYS
  // ============================================================================

  /**
   * Create a post-workshop follow-up survey
   * This automatically generates questions based on requirements captured in the workshop
   */
  async createPostWorkshopSurvey(workshopId, evaluationProjectId, options = {}) {
    try {
      // Get workshop details
      const { data: workshop, error: wsError } = await supabase
        .from('workshops')
        .select('id, name, scheduled_date')
        .eq('id', workshopId)
        .single();

      if (wsError) throw wsError;
      if (!workshop) throw new Error('Workshop not found');

      // Get requirements captured from this workshop
      const { data: requirements } = await supabase
        .from('requirements')
        .select('id, reference_code, title, description, priority')
        .eq('source_workshop_id', workshopId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('reference_code');

      // Build questions for validation
      const questions = [];

      // Introduction question
      questions.push({
        id: this.generateQuestionId(),
        type: QUESTION_TYPES.TEXTAREA,
        text: 'Do you have any additional requirements or feedback from the workshop that wasn\'t captured?',
        required: false,
        order: 0
      });

      // Rating for each captured requirement
      (requirements || []).forEach((req, idx) => {
        questions.push({
          id: this.generateQuestionId(),
          type: QUESTION_TYPES.RATING,
          text: `How accurately does this requirement capture your needs?\n\n**${req.reference_code}: ${req.title}**\n${req.description || ''}`,
          required: true,
          metadata: { requirementId: req.id, referenceCode: req.reference_code },
          order: idx + 1
        });

        // Optional comment for each requirement
        questions.push({
          id: this.generateQuestionId(),
          type: QUESTION_TYPES.TEXTAREA,
          text: `Any corrections or additions for ${req.reference_code}?`,
          required: false,
          metadata: { requirementId: req.id, referenceCode: req.reference_code, isComment: true },
          order: idx + 1.5
        });
      });

      // Final question
      questions.push({
        id: this.generateQuestionId(),
        type: QUESTION_TYPES.TEXTAREA,
        text: 'Any other comments or feedback about the workshop?',
        required: false,
        order: 999
      });

      // Create the survey
      const surveyData = {
        evaluation_project_id: evaluationProjectId,
        name: options.name || `Follow-up: ${workshop.name}`,
        description: options.description || `Please review and validate the requirements captured during "${workshop.name}".`,
        instructions: options.instructions || 'Please rate how accurately each requirement captures your needs. You can also add corrections or additional details.',
        type: SURVEY_TYPES.POST_WORKSHOP,
        linked_workshop_id: workshopId,
        questions,
        allow_anonymous: false,
        allow_multiple_responses: false,
        created_by: options.createdBy || null
      };

      return this.createSurvey(surveyData);
    } catch (error) {
      console.error('SurveysService createPostWorkshopSurvey failed:', error);
      throw error;
    }
  }

  /**
   * Get surveys linked to a workshop
   */
  async getByWorkshop(workshopId) {
    try {
      const { data, error } = await supabase
        .from('surveys')
        .select(`
          *,
          responses:survey_responses(id, status)
        `)
        .eq('linked_workshop_id', workshopId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('type');

      if (error) throw error;

      return (data || []).map(s => ({
        ...s,
        responseCount: s.responses?.length || 0,
        submittedCount: s.responses?.filter(r => r.status === 'submitted').length || 0
      }));
    } catch (error) {
      console.error('SurveysService getByWorkshop failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // RESPONSE MANAGEMENT
  // ============================================================================

  /**
   * Get all responses for a survey
   */
  async getResponses(surveyId) {
    try {
      const { data, error } = await supabase
        .from('survey_responses')
        .select(`
          *,
          respondent:profiles(id, full_name, email, avatar_url)
        `)
        .eq('survey_id', surveyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('SurveysService getResponses failed:', error);
      throw error;
    }
  }

  /**
   * Get a single response by ID
   */
  async getResponse(responseId) {
    try {
      const { data, error } = await supabase
        .from('survey_responses')
        .select(`
          *,
          respondent:profiles(id, full_name, email, avatar_url),
          survey:surveys(id, name, questions, type, linked_workshop_id)
        `)
        .eq('id', responseId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('SurveysService getResponse failed:', error);
      throw error;
    }
  }

  /**
   * Start a new response to a survey
   */
  async startResponse(surveyId, respondentData = {}) {
    try {
      // Check if survey is active
      const survey = await this.getById(surveyId);
      if (!survey) throw new Error('Survey not found');
      if (survey.status !== SURVEY_STATUSES.ACTIVE) {
        throw new Error('Survey is not currently accepting responses');
      }

      // Check for existing response if multiple not allowed
      if (!survey.allow_multiple_responses && respondentData.respondent_id) {
        const { data: existing } = await supabase
          .from('survey_responses')
          .select('id')
          .eq('survey_id', surveyId)
          .eq('respondent_id', respondentData.respondent_id)
          .limit(1);

        if (existing?.length > 0) {
          throw new Error('You have already responded to this survey');
        }
      }

      const responseData = {
        survey_id: surveyId,
        respondent_id: respondentData.respondent_id || null,
        respondent_email: respondentData.respondent_email || null,
        respondent_name: respondentData.respondent_name || null,
        answers: {},
        status: RESPONSE_STATUSES.IN_PROGRESS,
        started_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('survey_responses')
        .insert(responseData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('SurveysService startResponse failed:', error);
      throw error;
    }
  }


  /**
   * Update response answers (save progress)
   */
  async updateResponseAnswers(responseId, answers) {
    try {
      const { data, error } = await supabase
        .from('survey_responses')
        .update({ answers })
        .eq('id', responseId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('SurveysService updateResponseAnswers failed:', error);
      throw error;
    }
  }

  /**
   * Submit a response (mark as complete)
   */
  async submitResponse(responseId) {
    try {
      const { data, error } = await supabase
        .from('survey_responses')
        .update({
          status: RESPONSE_STATUSES.SUBMITTED,
          submitted_at: new Date().toISOString()
        })
        .eq('id', responseId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('SurveysService submitResponse failed:', error);
      throw error;
    }
  }

  /**
   * Get response for a specific respondent
   */
  async getRespondentResponse(surveyId, respondentId) {
    try {
      const { data, error } = await supabase
        .from('survey_responses')
        .select('*')
        .eq('survey_id', surveyId)
        .eq('respondent_id', respondentId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;
      return data?.[0] || null;
    } catch (error) {
      console.error('SurveysService getRespondentResponse failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // SHARE WITH ATTENDEES (FOLLOW-UP)
  // ============================================================================

  /**
   * Get workshop attendees who need to receive the follow-up survey
   * Returns attendees who attended but haven't completed the followup
   */
  async getFollowupRecipients(workshopId) {
    try {
      const { data, error } = await supabase
        .from('workshop_attendees')
        .select(`
          id,
          user_id,
          external_name,
          external_email,
          attended,
          followup_sent,
          followup_completed,
          user:profiles(id, full_name, email)
        `)
        .eq('workshop_id', workshopId)
        .eq('attended', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('SurveysService getFollowupRecipients failed:', error);
      throw error;
    }
  }

  /**
   * Send follow-up survey to attendees (marks as sent and returns recipient list)
   * Actual email sending would be handled by a separate email service
   */
  async sendFollowupToAttendees(surveyId, workshopId, attendeeIds = null) {
    try {
      // Get the survey
      const survey = await this.getById(surveyId);
      if (!survey) throw new Error('Survey not found');

      // Activate the survey if in draft
      if (survey.status === SURVEY_STATUSES.DRAFT) {
        await this.activate(surveyId);
      }

      // Build query for attendees
      let query = supabase
        .from('workshop_attendees')
        .select(`
          id,
          user_id,
          external_name,
          external_email,
          user:profiles(id, full_name, email)
        `)
        .eq('workshop_id', workshopId)
        .eq('attended', true);

      // Filter to specific attendees if provided
      if (attendeeIds && attendeeIds.length > 0) {
        query = query.in('id', attendeeIds);
      }

      const { data: attendees, error: attError } = await query;
      if (attError) throw attError;

      // Mark attendees as having been sent the followup
      const attendeeIdsToUpdate = (attendees || []).map(a => a.id);
      if (attendeeIdsToUpdate.length > 0) {
        await supabase
          .from('workshop_attendees')
          .update({
            followup_sent: true,
            followup_sent_at: new Date().toISOString()
          })
          .in('id', attendeeIdsToUpdate);
      }

      // Return the recipients (for display or email sending)
      return (attendees || []).map(a => ({
        attendeeId: a.id,
        userId: a.user_id,
        name: a.user?.full_name || a.external_name || 'Unknown',
        email: a.user?.email || a.external_email || null,
        surveyId: surveyId
      }));
    } catch (error) {
      console.error('SurveysService sendFollowupToAttendees failed:', error);
      throw error;
    }
  }

  /**
   * Mark attendee as having completed the followup
   */
  async markFollowupCompleted(workshopId, attendeeUserId) {
    try {
      const { data, error } = await supabase
        .from('workshop_attendees')
        .update({
          followup_completed: true,
          followup_completed_at: new Date().toISOString()
        })
        .eq('workshop_id', workshopId)
        .eq('user_id', attendeeUserId)
        .select();

      if (error) throw error;
      return data?.[0];
    } catch (error) {
      console.error('SurveysService markFollowupCompleted failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // REQUIREMENT CREATION FROM RESPONSES
  // ============================================================================

  /**
   * Create a requirement from a survey response answer
   * This links the new requirement back to the survey response for traceability
   */
  async createRequirementFromResponse(responseId, questionId, requirementData) {
    try {
      const response = await this.getResponse(responseId);
      if (!response) throw new Error('Response not found');

      // Get the survey to find the evaluation project
      const survey = response.survey;
      if (!survey) throw new Error('Survey not found');

      // Get next reference code
      const { data: lastReq } = await supabase
        .from('requirements')
        .select('reference_code')
        .eq('evaluation_project_id', survey.evaluation_project_id)
        .order('reference_code', { ascending: false })
        .limit(1);

      let nextCode = 'REQ-001';
      if (lastReq?.[0]?.reference_code) {
        const num = parseInt(lastReq[0].reference_code.replace('REQ-', ''), 10);
        nextCode = `REQ-${String(num + 1).padStart(3, '0')}`;
      }

      // Create the requirement
      const { data: requirement, error } = await supabase
        .from('requirements')
        .insert({
          evaluation_project_id: survey.evaluation_project_id,
          reference_code: nextCode,
          title: requirementData.title,
          description: requirementData.description || null,
          category_id: requirementData.category_id || null,
          stakeholder_area_id: requirementData.stakeholder_area_id || null,
          priority: requirementData.priority || 'should_have',
          status: 'draft',
          source_type: 'survey',
          source_survey_response_id: responseId,
          source_workshop_id: survey.linked_workshop_id || null,
          raised_by: response.respondent_id
        })
        .select()
        .single();

      if (error) throw error;
      return requirement;
    } catch (error) {
      console.error('SurveysService createRequirementFromResponse failed:', error);
      throw error;
    }
  }


  // ============================================================================
  // STATISTICS & REPORTING
  // ============================================================================

  /**
   * Get survey summary statistics for dashboard
   */
  async getSummary(evaluationProjectId) {
    try {
      const surveys = await this.getAllWithDetails(evaluationProjectId);

      const byType = {
        standalone: 0,
        pre_workshop: 0,
        post_workshop: 0,
        vendor_rfp: 0
      };

      const byStatus = {
        draft: 0,
        active: 0,
        closed: 0,
        archived: 0
      };

      let totalResponses = 0;
      let totalSubmitted = 0;

      surveys.forEach(s => {
        if (byType[s.type] !== undefined) byType[s.type]++;
        if (byStatus[s.status] !== undefined) byStatus[s.status]++;
        totalResponses += s.responseCount || 0;
        totalSubmitted += s.submittedCount || 0;
      });

      return {
        total: surveys.length,
        byType,
        byStatus,
        totalResponses,
        totalSubmitted,
        responseRate: totalResponses > 0 
          ? Math.round((totalSubmitted / totalResponses) * 100)
          : 0
      };
    } catch (error) {
      console.error('SurveysService getSummary failed:', error);
      throw error;
    }
  }

  /**
   * Get response statistics for a specific survey
   */
  async getResponseStats(surveyId) {
    try {
      const survey = await this.getByIdWithDetails(surveyId);
      if (!survey) return null;

      const responses = await this.getResponses(surveyId);
      const submitted = responses.filter(r => r.status === 'submitted');

      // Calculate completion rates per question
      const questions = survey.questions || [];
      const questionStats = questions.map(q => {
        const answered = submitted.filter(r => 
          r.answers && r.answers[q.id] !== undefined && r.answers[q.id] !== ''
        ).length;

        return {
          questionId: q.id,
          questionText: q.text,
          questionType: q.type,
          required: q.required,
          answeredCount: answered,
          answerRate: submitted.length > 0 
            ? Math.round((answered / submitted.length) * 100)
            : 0
        };
      });

      return {
        surveyId,
        surveyName: survey.name,
        totalResponses: responses.length,
        submittedResponses: submitted.length,
        inProgressResponses: responses.length - submitted.length,
        questionStats
      };
    } catch (error) {
      console.error('SurveysService getResponseStats failed:', error);
      throw error;
    }
  }

  /**
   * Export survey responses as flat data
   */
  async exportResponses(surveyId) {
    try {
      const survey = await this.getByIdWithDetails(surveyId);
      if (!survey) throw new Error('Survey not found');

      const responses = await this.getResponses(surveyId);
      const questions = survey.questions || [];

      // Build flat export
      return responses.map(r => {
        const row = {
          response_id: r.id,
          respondent_name: r.respondent?.full_name || r.respondent_name || 'Anonymous',
          respondent_email: r.respondent?.email || r.respondent_email || '',
          status: r.status,
          submitted_at: r.submitted_at || '',
          started_at: r.started_at || r.created_at
        };

        // Add each question as a column
        questions.forEach((q, idx) => {
          const answer = r.answers?.[q.id];
          row[`Q${idx + 1}: ${q.text.substring(0, 50)}`] = 
            Array.isArray(answer) ? answer.join(', ') : (answer || '');
        });

        return row;
      });
    } catch (error) {
      console.error('SurveysService exportResponses failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const surveysService = new SurveysService();
export default surveysService;
