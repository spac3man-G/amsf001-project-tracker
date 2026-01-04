/**
 * Evaluator Services Index
 * 
 * Central export point for all evaluator-related services.
 * 
 * @version 1.2
 * @created 01 January 2026
 * @updated 01 January 2026
 * @phase Phase 4 - Input Capture
 */

// Base service
export { EvaluatorBaseService } from './base.evaluator.service';

// Core services
export { evaluationProjectsService, EvaluationProjectsService } from './evaluationProjects.service';

// Requirements module services (Phase 3)
export { requirementsService, RequirementsService } from './requirements.service';
export { stakeholderAreasService, StakeholderAreasService } from './stakeholderAreas.service';
export { evaluationCategoriesService, EvaluationCategoriesService } from './evaluationCategories.service';

// Input Capture services (Phase 4)
export { 
  workshopsService, 
  WorkshopsService,
  WORKSHOP_STATUSES,
  WORKSHOP_STATUS_CONFIG,
  RSVP_STATUSES,
  RSVP_STATUS_CONFIG
} from './workshops.service';

export { 
  surveysService, 
  SurveysService,
  SURVEY_TYPES,
  SURVEY_TYPE_CONFIG,
  SURVEY_STATUSES,
  SURVEY_STATUS_CONFIG,
  QUESTION_TYPES,
  QUESTION_TYPE_CONFIG,
  RESPONSE_STATUSES
} from './surveys.service';

export { 
  evaluationDocumentsService, 
  EvaluationDocumentsService,
  DOCUMENT_TYPES,
  DOCUMENT_TYPE_CONFIG,
  PARSE_STATUSES,
  PARSE_STATUS_CONFIG,
  ALLOWED_FILE_TYPES
} from './evaluationDocuments.service';

// Phase 5: Vendor Management
export { 
  vendorsService, 
  VendorsService,
  VENDOR_STATUSES,
  VENDOR_STATUS_CONFIG,
  PIPELINE_STAGES,
  TERMINAL_STAGES
} from './vendors.service';

export { 
  vendorQuestionsService, 
  VendorQuestionsService,
  QUESTION_TYPES as VENDOR_QUESTION_TYPES,
  QUESTION_TYPE_CONFIG as VENDOR_QUESTION_TYPE_CONFIG,
  QUESTION_SECTIONS,
  QUESTION_SECTION_CONFIG
} from './vendorQuestions.service';

// Phase 6: Evaluation & Scoring
export { 
  evidenceService, 
  EvidenceService,
  EVIDENCE_TYPES,
  EVIDENCE_TYPE_CONFIG,
  EVIDENCE_SENTIMENT,
  EVIDENCE_SENTIMENT_CONFIG
} from './evidence.service';

export { 
  scoresService, 
  ScoresService,
  SCORE_STATUS,
  SCORE_STATUS_CONFIG
} from './scores.service';

// Phase 7: Traceability & Reports
export { 
  traceabilityService, 
  TraceabilityService,
  CELL_TYPES,
  RAG_THRESHOLDS,
  RAG_STATUS,
  RAG_CONFIG
} from './traceability.service';

export { 
  clientPortalService, 
  ClientPortalService,
  CLIENT_VIEW_PERMISSIONS,
  DEFAULT_CLIENT_PERMISSIONS
} from './clientPortal.service';

// Phase 8A: AI Services
export { 
  aiService, 
  AIService,
  AI_TASK_TYPES,
  AI_TASK_STATUS,
  AI_TASK_STATUS_CONFIG
} from './ai.service';

// Phase 9: Portal Refinement
export { 
  approvalsService, 
  ApprovalsService,
  APPROVAL_STATUS,
  APPROVAL_STATUS_CONFIG
} from './approvals.service';

export { 
  commentsService, 
  CommentsService,
  COMMENT_USER_TYPE,
  USER_TYPE_CONFIG
} from './comments.service';
