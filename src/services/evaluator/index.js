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


// Email Notifications (Phase 9)
export {
  emailNotificationService,
  EMAIL_NOTIFICATION_TYPE,
  EMAIL_TEMPLATES
} from './emailNotifications.service';

// v1.1: Dashboard Analytics
export { analyticsService } from './analytics.service';

// v1.1: Notifications System
export {
  notificationsService,
  NotificationsService,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES,
  EVENT_TYPES,
  DEADLINE_TYPES,
  DEADLINE_STATUS
} from './notifications.service';

// v1.1: Vendor Q&A System
export {
  vendorQAService,
  VendorQAService,
  QA_STATUS,
  QA_STATUS_CONFIG,
  QA_CATEGORIES
} from './vendorQA.service';

// v1.0.x: Stakeholder Engagement Framework
export {
  stakeholderEngagementService,
  StakeholderEngagementService,
  PHASE_GATES,
  PHASE_GATE_CONFIG,
  PARTICIPATION_WEIGHTS
} from './stakeholderEngagement.service';

// v1.0.x: Multi-Stage Security Assessment
export {
  securityAssessmentService,
  SecurityAssessmentService,
  SECURITY_STAGES,
  SECURITY_STAGE_CONFIG,
  ASSESSMENT_STATUS,
  ASSESSMENT_STATUS_CONFIG,
  RISK_LEVELS,
  RISK_LEVEL_CONFIG,
  FINDING_CATEGORIES,
  FINDING_CATEGORY_CONFIG,
  FINDING_STATUS,
  FINDING_STATUS_CONFIG
} from './securityAssessment.service';

// v1.1: Vendor Intelligence Enrichment
export {
  vendorIntelligenceService,
  VendorIntelligenceService,
  RISK_LEVELS as VIABILITY_RISK_LEVELS,
  RISK_LEVEL_CONFIG as VIABILITY_RISK_LEVEL_CONFIG,
  VIABILITY_RECOMMENDATIONS,
  VIABILITY_CONFIG
} from './vendorIntelligence.service';

// v1.1: Notification Triggers (Smart Notifications)
export {
  notificationTriggersService,
  NotificationTriggersService
} from './notificationTriggers.service';

// v1.0.x: Vendor Response Gaps (Enhanced AI Gap Detection)
export {
  vendorResponseGapsService,
  VendorResponseGapsService,
  GAP_TYPES,
  GAP_TYPE_CONFIG,
  GAP_SEVERITY,
  GAP_SEVERITY_CONFIG,
  GAP_STATUS,
  GAP_STATUS_CONFIG
} from './vendorResponseGaps.service';

// v1.0.x: Anomaly Detection & Risk Flagging
export {
  anomalyDetectionService,
  ANOMALY_TYPES,
  ANOMALY_SEVERITIES,
  ANOMALY_STATUSES,
  ACTION_TYPES,
  PRICING_TYPES,
  MILESTONE_TYPES
} from './anomalyDetection.service';

// v1.0.x: Risk Dashboard
export {
  risksService,
  RISK_CATEGORIES,
  RISK_CATEGORY_CONFIG,
  PROBABILITY_LEVELS,
  PROBABILITY_CONFIG,
  IMPACT_LEVELS,
  IMPACT_CONFIG,
  RISK_LEVELS as RISK_LEVEL_TYPES,
  RISK_LEVEL_CONFIG as RISK_LEVELS_CONFIG,
  MITIGATION_STATUSES,
  MITIGATION_STATUS_CONFIG,
  ISSUE_CATEGORIES,
  ISSUE_CATEGORY_CONFIG,
  ISSUE_PRIORITIES,
  ISSUE_PRIORITY_CONFIG,
  ISSUE_STATUSES,
  ISSUE_STATUS_CONFIG,
  COMMENT_TYPES as RISK_COMMENT_TYPES
} from './risks.service';

// v1.0.x: Financial Analysis Module
export {
  financialAnalysisService,
  FinancialAnalysisService,
  COST_CATEGORIES,
  COST_CATEGORY_CONFIG,
  ASSUMPTION_CATEGORIES,
  ASSUMPTION_CATEGORY_CONFIG,
  ADJUSTMENT_TYPES,
  BENEFIT_CATEGORIES,
  BENEFIT_CATEGORY_CONFIG
} from './financialAnalysis.service';

// v1.0.x: Procurement Workflow Tracking
export {
  procurementWorkflowService,
  ProcurementWorkflowService,
  PROCUREMENT_TYPES,
  PROCUREMENT_TYPE_CONFIG,
  WORKFLOW_STATUS,
  WORKFLOW_STATUS_CONFIG,
  STAGE_STATUS,
  STAGE_STATUS_CONFIG,
  MILESTONE_STATUS,
  ACTIVITY_TYPES
} from './procurementWorkflow.service';
