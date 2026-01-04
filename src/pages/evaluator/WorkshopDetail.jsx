/**
 * WorkshopDetail Page
 * 
 * Detail page for viewing and managing a single workshop.
 * Includes workshop info, attendee management, live capture mode,
 * and captured requirements list.
 * 
 * @version 1.0
 * @created 01 January 2026
 * @phase Phase 4 - Input Capture (Tasks 4A.5-4A.7)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Video,
  User,
  Users,
  UserCheck,
  Play,
  CheckCircle,
  XCircle,
  Edit2,
  ClipboardList,
  Send,
  Mail,
  ExternalLink,
  Settings
} from 'lucide-react';
import { useEvaluation } from '../../contexts/EvaluationContext';
import { useEvaluatorPermissions } from '../../hooks/useEvaluatorPermissions';
import { useAuth } from '../../contexts/AuthContext';
import { 
  PageHeader, 
  Card, 
  LoadingSpinner, 
  StatusBadge,
  ConfirmDialog,
  Toast
} from '../../components/common';
import { 
  workshopsService, 
  stakeholderAreasService,
  evaluationProjectsService,
  surveysService,
  WORKSHOP_STATUSES, 
  WORKSHOP_STATUS_CONFIG 
} from '../../services/evaluator';
import AttendeeManager from '../../components/evaluator/workshops/AttendeeManager';
import WorkshopCapture from '../../components/evaluator/workshops/WorkshopCapture';
import WorkshopForm from '../../components/evaluator/workshops/WorkshopForm';
import { ShareWithAttendees } from '../../components/evaluator/surveys';

import './WorkshopDetail.css';

// Format date/time
const formatDate = (dateString) => {
  if (!dateString) return 'Not scheduled';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const formatTime = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatDuration = (minutes) => {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
};

export default function WorkshopDetail() {
  const { workshopId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentEvaluation, evaluationId } = useEvaluation();
  const { canFacilitateWorkshops, isAdmin } = useEvaluatorPermissions();

  // State
  const [workshop, setWorkshop] = useState(null);
  const [stakeholderAreas, setStakeholderAreas] = useState([]);
  const [evaluationUsers, setEvaluationUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [toastMessage, setToastMessage] = useState(null);
  
  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [startConfirmOpen, setStartConfirmOpen] = useState(false);
  const [completeConfirmOpen, setCompleteConfirmOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  
  // Follow-up survey state
  const [followupSurvey, setFollowupSurvey] = useState(null);
  const [isCreatingFollowup, setIsCreatingFollowup] = useState(false);

  // Load workshop data
  const loadWorkshop = useCallback(async () => {
    if (!workshopId || !evaluationId) return;

    setIsLoading(true);
    setError(null);

    try {
      const [ws, areas, users, surveys] = await Promise.all([
        workshopsService.getByIdWithDetails(workshopId),
        stakeholderAreasService.getAll(evaluationId),
        evaluationProjectsService.getUsers(evaluationId),
        surveysService.getByWorkshop(workshopId)
      ]);

      if (!ws) {
        setError('Workshop not found');
        return;
      }

      setWorkshop(ws);
      setStakeholderAreas(areas || []);
      setEvaluationUsers(users || []);
      
      // Find post-workshop follow-up survey
      const postWorkshopSurvey = surveys?.find(s => s.type === 'post_workshop');
      setFollowupSurvey(postWorkshopSurvey || null);
    } catch (err) {
      console.error('Failed to load workshop:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [workshopId, evaluationId]);

  useEffect(() => {
    loadWorkshop();
  }, [loadWorkshop]);

  // Status workflow handlers
  const handleStart = useCallback(async () => {
    try {
      await workshopsService.start(workshopId);
      setToastMessage({ type: 'success', message: 'Workshop started! Capture mode enabled.' });
      setStartConfirmOpen(false);
      setActiveTab('capture');
      loadWorkshop();
    } catch (err) {
      setToastMessage({ type: 'error', message: err.message });
    }
  }, [workshopId, loadWorkshop]);

  const handleComplete = useCallback(async () => {
    try {
      await workshopsService.complete(workshopId);
      setToastMessage({ type: 'success', message: 'Workshop completed!' });
      setCompleteConfirmOpen(false);
      loadWorkshop();
    } catch (err) {
      setToastMessage({ type: 'error', message: err.message });
    }
  }, [workshopId, loadWorkshop]);

  const handleCancel = useCallback(async (reason) => {
    try {
      await workshopsService.cancel(workshopId, reason);
      setToastMessage({ type: 'success', message: 'Workshop cancelled' });
      setCancelConfirmOpen(false);
      loadWorkshop();
    } catch (err) {
      setToastMessage({ type: 'error', message: err.message });
    }
  }, [workshopId, loadWorkshop]);

  // Form save handler
  const handleFormSave = useCallback(() => {
    setEditModalOpen(false);
    setToastMessage({ type: 'success', message: 'Workshop updated' });
    loadWorkshop();
  }, [loadWorkshop]);

  // Create follow-up survey handler
  const handleCreateFollowup = useCallback(async () => {
    if (!evaluationId || !workshopId) return;

    setIsCreatingFollowup(true);
    try {
      const survey = await surveysService.createPostWorkshopSurvey(
        workshopId,
        evaluationId,
        { createdBy: user?.id }
      );
      setFollowupSurvey(survey);
      setToastMessage({ type: 'success', message: 'Follow-up survey created! You can now share it with attendees.' });
    } catch (err) {
      console.error('Failed to create follow-up survey:', err);
      setToastMessage({ type: 'error', message: 'Failed to create survey: ' + err.message });
    } finally {
      setIsCreatingFollowup(false);
    }
  }, [evaluationId, workshopId, user?.id]);

  // Handle share complete
  const handleShareComplete = useCallback((recipients) => {
    setShareModalOpen(false);
    setToastMessage({ 
      type: 'success', 
      message: `Survey shared with ${recipients.length} attendee${recipients.length !== 1 ? 's' : ''}` 
    });
    loadWorkshop();
  }, [loadWorkshop]);

  // Loading state
  if (isLoading) {
    return <LoadingSpinner message="Loading workshop..." fullPage />;
  }

  // Error state
  if (error || !workshop) {
    return (
      <div className="workshop-detail error-state">
        <div className="error-content">
          <h2>Workshop Not Found</h2>
          <p>{error || 'The requested workshop could not be found.'}</p>
          <Link to="/evaluator/workshops" className="btn btn-primary">
            <ArrowLeft size={16} />
            Back to Workshops
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = WORKSHOP_STATUS_CONFIG[workshop.status] || WORKSHOP_STATUS_CONFIG[WORKSHOP_STATUSES.DRAFT];
  const isActive = workshop.status === WORKSHOP_STATUSES.IN_PROGRESS;
  const isComplete = workshop.status === WORKSHOP_STATUSES.COMPLETE;
  const isCancelled = workshop.status === WORKSHOP_STATUSES.CANCELLED;
  const canStart = workshop.status === WORKSHOP_STATUSES.SCHEDULED && canFacilitateWorkshops;
  const canComplete = isActive && canFacilitateWorkshops;
  const canEdit = !isComplete && !isCancelled && canFacilitateWorkshops;

  return (
    <div className="workshop-detail">
      {/* Header */}
      <PageHeader
        title={workshop.name}
        subtitle={
          <div className="header-meta">
            <Link to="/evaluator/workshops" className="back-link">
              <ArrowLeft size={14} />
              Workshops
            </Link>
            <span className="separator">/</span>
            <span>{workshop.name}</span>
          </div>
        }
        actions={
          <div className="header-actions">
            {/* Status Badge */}
            <StatusBadge 
              status={statusConfig.color}
              style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.color }}
            >
              {statusConfig.label}
            </StatusBadge>

            {/* Action Buttons */}
            {canStart && (
              <button 
                className="btn btn-primary"
                onClick={() => setStartConfirmOpen(true)}
              >
                <Play size={16} />
                Start Workshop
              </button>
            )}
            {canComplete && (
              <button 
                className="btn btn-success"
                onClick={() => setCompleteConfirmOpen(true)}
              >
                <CheckCircle size={16} />
                Complete
              </button>
            )}
            {canEdit && (
              <button 
                className="btn btn-secondary"
                onClick={() => setEditModalOpen(true)}
              >
                <Edit2 size={16} />
                Edit
              </button>
            )}
          </div>
        }
      />

      {/* Tabs */}
      <div className="workshop-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Settings size={16} />
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'attendees' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendees')}
        >
          <Users size={16} />
          Attendees
          <span className="badge">{workshop.attendees?.length || 0}</span>
        </button>
        <button 
          className={`tab ${activeTab === 'capture' ? 'active' : ''}`}
          onClick={() => setActiveTab('capture')}
          disabled={workshop.status === WORKSHOP_STATUSES.DRAFT}
        >
          <ClipboardList size={16} />
          Capture
          {isActive && <span className="live-dot" />}
        </button>
        {isComplete && (
          <button 
            className={`tab ${activeTab === 'followup' ? 'active' : ''}`}
            onClick={() => setActiveTab('followup')}
          >
            <Send size={16} />
            Follow-up
            {followupSurvey && (
              <span className="badge">
                {followupSurvey.submittedCount || 0}/{followupSurvey.responseCount || 0}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="workshop-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="overview-grid">
              {/* Workshop Details Card */}
              <Card className="details-card">
                <h3>Workshop Details</h3>
                
                {workshop.description && (
                  <div className="detail-section">
                    <label>Description</label>
                    <p>{workshop.description}</p>
                  </div>
                )}

                {workshop.objectives && (
                  <div className="detail-section">
                    <label>Objectives</label>
                    <p>{workshop.objectives}</p>
                  </div>
                )}

                <div className="detail-row">
                  <div className="detail-item">
                    <Calendar size={14} />
                    <span className="label">Date</span>
                    <span className="value">
                      {formatDate(workshop.actual_date || workshop.scheduled_date)}
                    </span>
                  </div>
                  {(workshop.scheduled_date || workshop.actual_date) && (
                    <div className="detail-item">
                      <Clock size={14} />
                      <span className="label">Time</span>
                      <span className="value">
                        {formatTime(workshop.actual_date || workshop.scheduled_date)}
                      </span>
                    </div>
                  )}
                  <div className="detail-item">
                    <Clock size={14} />
                    <span className="label">Duration</span>
                    <span className="value">
                      {formatDuration(workshop.actual_duration_minutes || workshop.scheduled_duration_minutes)}
                    </span>
                  </div>
                </div>

                <div className="detail-row">
                  {workshop.location && (
                    <div className="detail-item">
                      <MapPin size={14} />
                      <span className="label">Location</span>
                      <span className="value">{workshop.location}</span>
                    </div>
                  )}
                  {workshop.meeting_link && (
                    <div className="detail-item">
                      <Video size={14} />
                      <span className="label">Meeting</span>
                      <a 
                        href={workshop.meeting_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="value link"
                      >
                        Join Meeting
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  )}
                </div>

                {workshop.facilitator && (
                  <div className="detail-section">
                    <label>Facilitator</label>
                    <div className="facilitator-info">
                      {workshop.facilitator.avatar_url ? (
                        <img 
                          src={workshop.facilitator.avatar_url} 
                          alt={workshop.facilitator.full_name}
                          className="avatar"
                        />
                      ) : (
                        <div className="avatar placeholder">
                          <User size={16} />
                        </div>
                      )}
                      <span>{workshop.facilitator.full_name}</span>
                    </div>
                  </div>
                )}
              </Card>

              {/* Quick Stats Card */}
              <Card className="stats-card">
                <h3>Quick Stats</h3>
                <div className="stats-grid">
                  <div className="stat">
                    <span className="stat-value">{workshop.attendees?.length || 0}</span>
                    <span className="stat-label">Invited</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">
                      {workshop.attendees?.filter(a => a.rsvp_status === 'accepted').length || 0}
                    </span>
                    <span className="stat-label">Confirmed</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">
                      {workshop.attendees?.filter(a => a.attended).length || 0}
                    </span>
                    <span className="stat-label">Attended</span>
                  </div>
                </div>
              </Card>

              {/* Notes/Summary Card */}
              {(workshop.notes || workshop.summary) && (
                <Card className="notes-card">
                  <h3>Notes & Summary</h3>
                  {workshop.summary && (
                    <div className="detail-section">
                      <label>Summary</label>
                      <p>{workshop.summary}</p>
                    </div>
                  )}
                  {workshop.notes && (
                    <div className="detail-section">
                      <label>Notes</label>
                      <p className="notes-text">{workshop.notes}</p>
                    </div>
                  )}
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Attendees Tab */}
        {activeTab === 'attendees' && (
          <div className="attendees-tab">
            <AttendeeManager
              workshop={workshop}
              attendees={workshop.attendees || []}
              stakeholderAreas={stakeholderAreas}
              evaluationUsers={evaluationUsers}
              onAttendeesChange={loadWorkshop}
              isReadOnly={isComplete || isCancelled}
            />
          </div>
        )}

        {/* Capture Tab */}
        {activeTab === 'capture' && (
          <div className="capture-tab">
            {workshop.status === WORKSHOP_STATUSES.DRAFT ? (
              <div className="capture-disabled">
                <ClipboardList size={48} />
                <h3>Capture Mode Not Available</h3>
                <p>Schedule and start the workshop to enable requirement capture.</p>
              </div>
            ) : (
              <WorkshopCapture
                workshop={workshop}
                attendees={workshop.attendees || []}
                onRequirementCaptured={loadWorkshop}
              />
            )}
          </div>
        )}

        {/* Follow-up Tab */}
        {activeTab === 'followup' && isComplete && (
          <div className="followup-tab">
            <Card className="followup-card">
              <h3>Post-Workshop Follow-up</h3>
              <p className="followup-description">
                Send a validation survey to attendees to verify captured requirements 
                and gather any additional feedback.
              </p>
              
              {!followupSurvey ? (
                <div className="followup-create">
                  <p>No follow-up survey has been created yet.</p>
                  <button
                    className="btn btn-primary"
                    onClick={handleCreateFollowup}
                    disabled={isCreatingFollowup}
                  >
                    <ClipboardList size={16} />
                    {isCreatingFollowup ? 'Creating...' : 'Create Follow-up Survey'}
                  </button>
                </div>
              ) : (
                <div className="followup-status">
                  <div className="survey-info">
                    <h4>{followupSurvey.name}</h4>
                    <div className="survey-stats">
                      <span className="stat">
                        <strong>{followupSurvey.questionCount || 0}</strong> questions
                      </span>
                      <span className="stat">
                        <strong>{followupSurvey.responseCount || 0}</strong> responses
                      </span>
                      <span className="stat">
                        <strong>{followupSurvey.submittedCount || 0}</strong> submitted
                      </span>
                    </div>
                  </div>
                  <div className="survey-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => setShareModalOpen(true)}
                    >
                      <Send size={16} />
                      Share with Attendees
                    </button>
                    <Link
                      to={`/evaluator/surveys/${followupSurvey.id}`}
                      className="btn btn-secondary"
                    >
                      <ExternalLink size={16} />
                      View Survey
                    </Link>
                  </div>
                </div>
              )}
            </Card>

            {/* Attendee response status */}
            {followupSurvey && (
              <Card className="attendee-responses-card">
                <h3>Attendee Responses</h3>
                <div className="attendee-response-list">
                  {workshop.attendees?.filter(a => a.attended).map(attendee => {
                    const name = attendee.user?.full_name || attendee.external_name || 'Unknown';
                    return (
                      <div key={attendee.id} className="attendee-response-row">
                        <span className="attendee-name">{name}</span>
                        <span className={`response-status ${
                          attendee.followup_completed ? 'completed' : 
                          attendee.followup_sent ? 'sent' : 'pending'
                        }`}>
                          {attendee.followup_completed ? (
                            <><CheckCircle size={14} /> Completed</>
                          ) : attendee.followup_sent ? (
                            <><Mail size={14} /> Sent</>
                          ) : (
                            <><Clock size={14} /> Not sent</>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editModalOpen && (
        <WorkshopForm
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSave={handleFormSave}
          workshop={workshop}
          stakeholderAreas={stakeholderAreas}
          evaluationUsers={evaluationUsers}
        />
      )}

      {/* Start Confirmation */}
      <ConfirmDialog
        isOpen={startConfirmOpen}
        title="Start Workshop"
        message="Starting the workshop will enable live requirement capture mode. Are you ready to begin?"
        confirmText="Start Workshop"
        onConfirm={handleStart}
        onClose={() => setStartConfirmOpen(false)}
      />

      {/* Complete Confirmation */}
      <ConfirmDialog
        isOpen={completeConfirmOpen}
        title="Complete Workshop"
        message="Mark this workshop as complete? You can still view captured requirements but won't be able to add new ones."
        confirmText="Complete"
        onConfirm={handleComplete}
        onClose={() => setCompleteConfirmOpen(false)}
      />

      {/* Cancel Confirmation */}
      <ConfirmDialog
        isOpen={cancelConfirmOpen}
        title="Cancel Workshop"
        message="Are you sure you want to cancel this workshop?"
        confirmText="Cancel Workshop"
        type="danger"
        onConfirm={() => {
          const reason = window.prompt('Please provide a reason (optional):');
          handleCancel(reason);
        }}
        onClose={() => setCancelConfirmOpen(false)}
      />

      {/* Share with Attendees Modal */}
      {shareModalOpen && followupSurvey && (
        <ShareWithAttendees
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          workshopId={workshopId}
          surveyId={followupSurvey.id}
          onShareComplete={handleShareComplete}
        />
      )}

      {/* Toast */}
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.message}
          onClose={() => setToastMessage(null)}
        />
      )}
    </div>
  );
}
