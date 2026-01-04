/**
 * VendorPortal Page
 * 
 * Public-facing portal for vendors to view and respond to questions.
 * Authentication is done via access codes, not user accounts.
 * 
 * @version 1.0
 * @created 03 January 2026
 * @phase Phase 5 - Vendor Management (Task 5B.6)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  Key,
  LogOut,
  FileText,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Clock,
  Send,
  Save
} from 'lucide-react';
import { vendorQuestionsService, QUESTION_SECTION_CONFIG } from '../../services/evaluator';
import './VendorPortal.css';

// Portal states
const PORTAL_STATE = {
  LOGIN: 'login',
  AUTHENTICATED: 'authenticated',
  LOADING: 'loading',
  ERROR: 'error'
};

function VendorPortal() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Auth state
  const [portalState, setPortalState] = useState(PORTAL_STATE.LOGIN);
  const [accessCode, setAccessCode] = useState('');
  const [session, setSession] = useState(null);
  const [authError, setAuthError] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Questions state
  const [questions, setQuestions] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [activeSection, setActiveSection] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    const savedSession = sessionStorage.getItem('vendorPortalSession');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (new Date(parsed.expiresAt) > new Date()) {
          setSession(parsed);
          setPortalState(PORTAL_STATE.AUTHENTICATED);
        } else {
          sessionStorage.removeItem('vendorPortalSession');
        }
      } catch (e) {
        sessionStorage.removeItem('vendorPortalSession');
      }
    }

    // Check for code in URL params
    const codeParam = searchParams.get('code');
    if (codeParam) {
      setAccessCode(codeParam);
    }
  }, [searchParams]);

  // Fetch questions when authenticated
  const fetchQuestions = useCallback(async () => {
    if (!session?.vendor?.id || !session?.evaluationProject?.id) return;

    try {
      setLoadingQuestions(true);
      const [questionsData, progressData] = await Promise.all([
        vendorQuestionsService.getQuestionsWithResponses(
          session.evaluationProject.id,
          session.vendor.id
        ),
        vendorQuestionsService.getResponseProgress(
          session.evaluationProject.id,
          session.vendor.id
        )
      ]);

      setQuestions(questionsData);
      setProgress(progressData);

      // Set first section as active
      if (questionsData.length > 0 && !activeSection) {
        const firstSection = questionsData[0]?.section;
        setActiveSection(firstSection);
      }
    } catch (err) {
      console.error('Failed to fetch questions:', err);
    } finally {
      setLoadingQuestions(false);
    }
  }, [session, activeSection]);

  useEffect(() => {
    if (portalState === PORTAL_STATE.AUTHENTICATED) {
      fetchQuestions();
    }
  }, [portalState, fetchQuestions]);

  // Authentication handler
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!accessCode.trim()) {
      setAuthError('Please enter your access code');
      return;
    }

    try {
      setIsAuthenticating(true);
      setAuthError(null);

      const response = await fetch('/api/evaluator/vendor-portal-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessCode: accessCode.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      // Save session
      sessionStorage.setItem('vendorPortalSession', JSON.stringify(data));
      setSession(data);
      setPortalState(PORTAL_STATE.AUTHENTICATED);
    } catch (err) {
      console.error('Login error:', err);
      setAuthError(err.message || 'Failed to authenticate. Please check your access code.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    sessionStorage.removeItem('vendorPortalSession');
    setSession(null);
    setAccessCode('');
    setQuestions([]);
    setProgress(null);
    setPortalState(PORTAL_STATE.LOGIN);
  };

  // Group questions by section
  const questionsBySection = questions.reduce((acc, q) => {
    const section = q.section || 'other';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(q);
    return acc;
  }, {});

  const sections = Object.keys(questionsBySection).sort((a, b) => {
    const orderA = QUESTION_SECTION_CONFIG[a]?.order || 99;
    const orderB = QUESTION_SECTION_CONFIG[b]?.order || 99;
    return orderA - orderB;
  });

  // Render login form
  if (portalState === PORTAL_STATE.LOGIN) {
    return (
      <div className="vendor-portal vendor-portal-login">
        <div className="vendor-portal-login-card">
          <div className="vendor-portal-login-header">
            <Building2 size={40} />
            <h1>Vendor Portal</h1>
            <p>Enter your access code to view and respond to questions</p>
          </div>

          <form onSubmit={handleLogin} className="vendor-portal-login-form">
            <div className="vendor-portal-field">
              <label htmlFor="access-code">
                <Key size={16} />
                Access Code
              </label>
              <input
                id="access-code"
                type="text"
                value={accessCode}
                onChange={e => setAccessCode(e.target.value.toUpperCase())}
                placeholder="Enter your access code"
                maxLength={12}
                autoFocus
              />
            </div>

            {authError && (
              <div className="vendor-portal-error">
                <AlertCircle size={16} />
                {authError}
              </div>
            )}

            <button 
              type="submit" 
              className="vendor-portal-login-btn"
              disabled={isAuthenticating}
            >
              {isAuthenticating ? (
                <>
                  <span className="spinner-small" />
                  Verifying...
                </>
              ) : (
                <>
                  <ChevronRight size={18} />
                  Access Portal
                </>
              )}
            </button>
          </form>

          <div className="vendor-portal-login-footer">
            <p>Don't have an access code?</p>
            <p>Please contact the evaluation team for assistance.</p>
          </div>
        </div>
      </div>
    );
  }

  // Render authenticated portal
  return (
    <div className="vendor-portal">
      {/* Header */}
      <header className="vendor-portal-header">
        <div className="vendor-portal-brand">
          <Building2 size={24} />
          <div>
            <h1>{session?.evaluationProject?.name || 'Vendor Portal'}</h1>
            <p>{session?.vendor?.name}</p>
          </div>
        </div>
        <button className="vendor-portal-logout" onClick={handleLogout}>
          <LogOut size={18} />
          Sign Out
        </button>
      </header>

      {/* Progress Banner */}
      {progress && (
        <div className="vendor-portal-progress">
          <div className="vendor-portal-progress-info">
            <CheckCircle size={20} />
            <div>
              <strong>{progress.percentComplete}% Complete</strong>
              <span>
                {progress.answered} of {progress.total} questions answered
                {progress.required > 0 && (
                  <> ({progress.requiredAnswered}/{progress.required} required)</>
                )}
              </span>
            </div>
          </div>
          <div className="vendor-portal-progress-bar">
            <div 
              className="vendor-portal-progress-fill"
              style={{ width: `${progress.percentComplete}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="vendor-portal-main">
        {/* Sidebar - Section Navigation */}
        <nav className="vendor-portal-sidebar">
          <h2>
            <FileText size={18} />
            Sections
          </h2>
          <ul className="vendor-portal-sections">
            {sections.map(sectionKey => {
              const config = QUESTION_SECTION_CONFIG[sectionKey] || {};
              const sectionQuestions = questionsBySection[sectionKey] || [];
              const answeredCount = sectionQuestions.filter(q => q.response).length;
              const isActive = activeSection === sectionKey;

              return (
                <li key={sectionKey}>
                  <button
                    className={`vendor-portal-section-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveSection(sectionKey)}
                  >
                    <span className="section-name">{config.label || sectionKey}</span>
                    <span className="section-progress">
                      {answeredCount}/{sectionQuestions.length}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {progress?.isComplete && (
            <button className="vendor-portal-submit-btn">
              <Send size={16} />
              Submit Responses
            </button>
          )}
        </nav>

        {/* Questions Area */}
        <main className="vendor-portal-content">
          {loadingQuestions ? (
            <div className="vendor-portal-loading">
              <div className="spinner" />
              <span>Loading questions...</span>
            </div>
          ) : activeSection && questionsBySection[activeSection] ? (
            <div className="vendor-portal-questions">
              <div className="vendor-portal-section-header">
                <h2>{QUESTION_SECTION_CONFIG[activeSection]?.label || activeSection}</h2>
                {QUESTION_SECTION_CONFIG[activeSection]?.description && (
                  <p>{QUESTION_SECTION_CONFIG[activeSection].description}</p>
                )}
              </div>

              <div className="vendor-portal-question-list">
                {questionsBySection[activeSection].map((question, index) => (
                  <QuestionItem 
                    key={question.id}
                    question={question}
                    index={index}
                    vendorId={session?.vendor?.id}
                    onResponseSaved={fetchQuestions}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="vendor-portal-empty">
              <FileText size={48} />
              <h3>No Questions</h3>
              <p>Select a section from the sidebar to view questions.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/**
 * Individual Question Item Component
 */
function QuestionItem({ question, index, vendorId, onResponseSaved }) {
  const [response, setResponse] = useState(question.response?.response_text || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await vendorQuestionsService.saveResponse(vendorId, question.id, {
        response_text: response
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onResponseSaved?.();
    } catch (err) {
      console.error('Failed to save response:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const hasResponse = !!question.response;
  const isModified = response !== (question.response?.response_text || '');

  return (
    <div className={`vendor-question-item ${hasResponse ? 'has-response' : ''}`}>
      <div className="vendor-question-header">
        <span className="vendor-question-number">Q{index + 1}</span>
        {question.is_required && (
          <span className="vendor-question-required">Required</span>
        )}
        {hasResponse && !isModified && (
          <span className="vendor-question-answered">
            <CheckCircle size={14} />
            Answered
          </span>
        )}
      </div>

      <p className="vendor-question-text">{question.question_text}</p>
      
      {question.help_text && (
        <p className="vendor-question-help">{question.help_text}</p>
      )}

      <div className="vendor-question-response">
        {question.question_type === 'long_text' ? (
          <textarea
            value={response}
            onChange={e => setResponse(e.target.value)}
            placeholder="Enter your response..."
            rows={4}
          />
        ) : question.question_type === 'yes_no' ? (
          <div className="vendor-question-yesno">
            <label>
              <input
                type="radio"
                name={`q-${question.id}`}
                checked={response === 'yes'}
                onChange={() => setResponse('yes')}
              />
              Yes
            </label>
            <label>
              <input
                type="radio"
                name={`q-${question.id}`}
                checked={response === 'no'}
                onChange={() => setResponse('no')}
              />
              No
            </label>
          </div>
        ) : question.question_type === 'single_choice' && question.options ? (
          <div className="vendor-question-choices">
            {question.options.map((opt, i) => (
              <label key={i}>
                <input
                  type="radio"
                  name={`q-${question.id}`}
                  checked={response === (typeof opt === 'string' ? opt : opt.value)}
                  onChange={() => setResponse(typeof opt === 'string' ? opt : opt.value)}
                />
                {typeof opt === 'string' ? opt : opt.label}
              </label>
            ))}
          </div>
        ) : (
          <input
            type="text"
            value={response}
            onChange={e => setResponse(e.target.value)}
            placeholder="Enter your response..."
          />
        )}
      </div>

      <div className="vendor-question-actions">
        <button 
          className="vendor-save-btn"
          onClick={handleSave}
          disabled={isSaving || !isModified}
        >
          {isSaving ? (
            <>
              <span className="spinner-small" />
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle size={14} />
              Saved!
            </>
          ) : (
            <>
              <Save size={14} />
              Save Response
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default VendorPortal;
