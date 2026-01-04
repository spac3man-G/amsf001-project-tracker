/**
 * Surveys Components Index
 * 
 * Central export point for all survey-related components.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 4 - Input Capture (Session 4B)
 */

// Survey builder
export { default as SurveyBuilder, SurveyBuilder as SurveyBuilderComponent } from './SurveyBuilder';

// Survey response/capture
export { 
  default as SurveyResponse, 
  SurveyResponse as SurveyResponseComponent,
  validateSurveyResponse 
} from './SurveyResponse';

// Workshop follow-up
export { 
  default as WorkshopFollowup, 
  WorkshopFollowup as WorkshopFollowupComponent 
} from './WorkshopFollowup';

// Share with attendees modal
export { 
  default as ShareWithAttendees, 
  ShareWithAttendees as ShareWithAttendeesComponent 
} from './ShareWithAttendees';
