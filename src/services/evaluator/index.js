/**
 * Evaluator Services Index
 * 
 * Central export point for all evaluator-related services.
 * 
 * @version 1.1
 * @created 01 January 2026
 * @updated 01 January 2026
 * @phase Phase 3 - Requirements Module
 */

// Base service
export { EvaluatorBaseService } from './base.evaluator.service';

// Core services
export { evaluationProjectsService, EvaluationProjectsService } from './evaluationProjects.service';

// Requirements module services (Phase 3)
export { requirementsService, RequirementsService } from './requirements.service';
export { stakeholderAreasService, StakeholderAreasService } from './stakeholderAreas.service';
export { evaluationCategoriesService, EvaluationCategoriesService } from './evaluationCategories.service';

// Future services (will be added in later phases)
// Phase 4: Input Capture
// export { workshopsService, WorkshopsService } from './workshops.service';
// export { surveysService, SurveysService } from './surveys.service';
// export { evaluationDocumentsService, EvaluationDocumentsService } from './evaluationDocuments.service';

// Phase 5: Vendor Management
// export { vendorsService, VendorsService } from './vendors.service';
// export { vendorQuestionsService, VendorQuestionsService } from './vendorQuestions.service';

// Phase 6: Evaluation & Scoring
// export { evidenceService, EvidenceService } from './evidence.service';
// export { scoresService, ScoresService } from './scores.service';

// Phase 7: Traceability & Reports
// export { traceabilityService, TraceabilityService } from './traceability.service';
