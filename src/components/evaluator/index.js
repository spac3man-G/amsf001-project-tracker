/**
 * Evaluator Components Index
 * 
 * Central export point for all evaluator-related components.
 * 
 * @version 1.3
 * @created 01 January 2026
 * @updated 01 January 2026 - Added Phase 4 workshops components
 * @phase Phase 4 - Input Capture
 */

// Common components
export { default as EvaluationSwitcher } from './EvaluationSwitcher';
export { default as CreateEvaluationModal } from './CreateEvaluationModal';

// Requirements components (Phase 3)
export { 
  RequirementFilters, 
  RequirementForm, 
  RequirementCard,
  RequirementMatrix 
} from './requirements';

// Settings components (Phase 3, Session 3C)
export { 
  StakeholderAreasManager, 
  EvaluationCategoriesManager,
  ScoringScaleManager
} from './settings';

// Workshops components (Phase 4)
export { 
  WorkshopCard, 
  WorkshopForm 
} from './workshops';

// Surveys components (Phase 4, Session 4B)
export {
  SurveyBuilder,
  SurveyResponse,
  validateSurveyResponse,
  WorkshopFollowup,
  ShareWithAttendees
} from './surveys';

// Documents components (Phase 4, Session 4C)
export {
  DocumentUploader,
  DocumentCard,
  DocumentList,
  DocumentViewer
} from './documents';

// Future components (will be added in later phases)

// Phase 5: Vendors
export { 
  VendorCard, 
  VendorPipeline,
  VendorForm
} from './vendors';

// Phase 5: Questions
export {
  QuestionCard,
  QuestionForm,
  QuestionList,
  VendorResponseForm
} from './questions';

// Phase 6: Scoring
export {
  EvidenceCard,
  EvidenceForm,
  ScoringInterface,
  ScoreCard,
  ReconciliationPanel
} from './scoring';

// Phase 7: Traceability
export {
  TraceabilityMatrix,
  TraceabilityDrilldown
} from './traceability';

// Phase 7B: Client Portal
export {
  ClientDashboard,
  RequirementApproval,
  RequirementApprovalList,
  RequirementComments
} from './client';

// Phase 8A: AI Components
export {
  ParsedRequirementsReview,
  GapAnalysisResults
} from './ai';

// Phase 9: Vendor Portal Components
export {
  ProgressTracker,
  VendorDocumentUploader,
  DOCUMENT_CATEGORIES,
  REQUIRED_DOCUMENTS
} from './vendor';

// Phase 9: Shared Portal Components
export {
  SessionTimeout,
  useSessionTimeout
} from './shared';
