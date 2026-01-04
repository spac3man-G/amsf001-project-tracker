/**
 * QuestionsHub Page
 * 
 * Main hub page for managing vendor questions.
 * Questions are sent to vendors as part of the RFP process.
 * 
 * @version 1.0
 * @created 03 January 2026
 * @phase Phase 5 - Vendor Management (Task 5B.2)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Download,
  MoreVertical,
  Edit,
  Trash2,
  Link,
  X,
  ChevronRight
} from 'lucide-react';
import { useEvaluation } from '../../contexts/EvaluationContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  vendorQuestionsService,
  requirementsService,
  evaluationCategoriesService,
  QUESTION_SECTIONS,
  QUESTION_SECTION_CONFIG
} from '../../services/evaluator';
import { QuestionList, QuestionForm } from '../../components/evaluator';
import './QuestionsHub.css';

function QuestionsHub() {
  const navigate = useNavigate();
  const { currentEvaluation } = useEvaluation();
  const { user } = useAuth();

  // State
  const [questionsBySection, setQuestionsBySection] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sectionFilter, setSectionFilter] = useState('all');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [defaultSection, setDefaultSection] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Context menu state
  const [menuQuestion, setMenuQuestion] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!currentEvaluation?.id) return;

    try {
      setLoading(true);
      setError(null);

      const [questionsData, reqsData, categoriesData] = await Promise.all([
        vendorQuestionsService.getBySection(currentEvaluation.id),
        requirementsService.getAll(currentEvaluation.id),
        evaluationCategoriesService.getAllWithCriteria(currentEvaluation.id)
      ]);

      setQuestionsBySection(questionsData);
      setRequirements(reqsData);
      
      // Flatten criteria from categories
      const allCriteria = categoriesData.flatMap(cat => 
        (cat.criteria || []).map(c => ({
          ...c,
          categoryName: cat.name
        }))
      );
      setCriteria(allCriteria);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load questions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentEvaluation?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter questions
  const filteredSections = questionsBySection
    .map(section => ({
      ...section,
      questions: section.questions.filter(q => {
        // Section filter
        if (sectionFilter !== 'all' && section.key !== sectionFilter) {
          return false;
        }
        // Search filter
        if (searchTerm) {
          const search = searchTerm.toLowerCase();
          return (
            q.question_text.toLowerCase().includes(search) ||
            q.help_text?.toLowerCase().includes(search)
          );
        }
        return true;
      })
    }))
    .filter(section => sectionFilter === 'all' || section.key === sectionFilter);

  // Get stats
  const totalQuestions = questionsBySection.reduce(
    (sum, s) => sum + s.questions.length, 0
  );
  const requiredQuestions = questionsBySection.reduce(
    (sum, s) => sum + s.questions.filter(q => q.is_required).length, 0
  );
  const linkedQuestions = questionsBySection.reduce(
    (sum, s) => sum + s.questions.filter(q => q.requirement_id || q.criterion_id).length, 0
  );

  // Handlers
  const handleAddQuestion = (section = null) => {
    setDefaultSection(section);
    setEditingQuestion(null);
    setShowAddModal(true);
  };

  const handleQuestionClick = (question) => {
    setEditingQuestion(question);
    setDefaultSection(null);
    setShowAddModal(true);
    setMenuQuestion(null);
  };

  const handleQuestionMenuClick = (question, event) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({ 
      x: rect.right, 
      y: rect.bottom 
    });
    setMenuQuestion(question);
  };

  const handleSubmitQuestion = async (formData) => {
    try {
      setIsSubmitting(true);

      if (editingQuestion) {
        await vendorQuestionsService.updateQuestion(editingQuestion.id, formData);
      } else {
        await vendorQuestionsService.createQuestion(formData);
      }

      setShowAddModal(false);
      setEditingQuestion(null);
      setDefaultSection(null);
      fetchData();
    } catch (err) {
      console.error('Failed to save question:', err);
      setError('Failed to save question. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (question) => {
    if (!confirm(`Are you sure you want to delete this question?`)) return;

    try {
      await vendorQuestionsService.delete(question.id, user?.id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete question:', err);
      setError('Failed to delete question. Please try again.');
    }
    setMenuQuestion(null);
  };

  const handleReorderQuestions = async (sectionKey, questionIds) => {
    try {
      await vendorQuestionsService.reorderQuestions(
        currentEvaluation.id, 
        sectionKey, 
        questionIds
      );
      fetchData();
    } catch (err) {
      console.error('Failed to reorder questions:', err);
      setError('Failed to reorder questions.');
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    if (menuQuestion) {
      const handleClickOutside = () => setMenuQuestion(null);
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [menuQuestion]);

  if (!currentEvaluation) {
    return (
      <div className="questions-hub">
        <div className="questions-hub-empty">
          <FileText size={48} />
          <h2>No Evaluation Selected</h2>
          <p>Please select an evaluation project to manage questions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="questions-hub">
      {/* Header */}
      <div className="questions-hub-header">
        <div className="questions-hub-title-section">
          <h1>
            <FileText size={24} />
            Vendor Questions
          </h1>
          <p className="questions-hub-subtitle">
            {currentEvaluation.name}
          </p>
        </div>

        <div className="questions-hub-actions">
          <button 
            className="questions-hub-btn questions-hub-btn-secondary"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>
          <button 
            className="questions-hub-btn questions-hub-btn-primary"
            onClick={() => handleAddQuestion()}
          >
            <Plus size={16} />
            Add Question
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="questions-hub-stats">
        <div className="question-stat">
          <span className="question-stat-value">{totalQuestions}</span>
          <span className="question-stat-label">Total Questions</span>
        </div>
        <div className="question-stat">
          <span className="question-stat-value">{requiredQuestions}</span>
          <span className="question-stat-label">Required</span>
        </div>
        <div className="question-stat">
          <span className="question-stat-value">{linkedQuestions}</span>
          <span className="question-stat-label">Linked</span>
        </div>
        <div className="question-stat">
          <span className="question-stat-value">
            {Object.keys(QUESTION_SECTION_CONFIG).length}
          </span>
          <span className="question-stat-label">Sections</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="questions-hub-toolbar">
        <div className="questions-hub-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="questions-search-clear"
              onClick={() => setSearchTerm('')}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="questions-hub-filters">
          <div className="questions-filter-group">
            <Filter size={16} />
            <select 
              value={sectionFilter}
              onChange={e => setSectionFilter(e.target.value)}
            >
              <option value="all">All Sections</option>
              {Object.entries(QUESTION_SECTION_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="questions-hub-error">
          {error}
          <button onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="questions-hub-content">
        <QuestionList
          questionsBySection={filteredSections}
          onQuestionClick={handleQuestionClick}
          onQuestionMenuClick={handleQuestionMenuClick}
          onAddQuestion={handleAddQuestion}
          onReorder={handleReorderQuestions}
          loading={loading}
          emptyMessage="Add questions that will be sent to vendors during the RFP process"
        />
      </div>

      {/* Context Menu */}
      {menuQuestion && (
        <div 
          className="question-context-menu"
          style={{ 
            top: menuPosition.y,
            left: Math.min(menuPosition.x, window.innerWidth - 180)
          }}
          onClick={e => e.stopPropagation()}
        >
          <button onClick={() => handleQuestionClick(menuQuestion)}>
            <Edit size={16} />
            Edit Question
          </button>
          <div className="question-menu-divider" />
          <button 
            className="question-menu-danger"
            onClick={() => handleDeleteQuestion(menuQuestion)}
          >
            <Trash2 size={16} />
            Delete Question
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <QuestionForm
          question={editingQuestion}
          evaluationProjectId={currentEvaluation.id}
          requirements={requirements}
          criteria={criteria}
          onSubmit={handleSubmitQuestion}
          onCancel={() => {
            setShowAddModal(false);
            setEditingQuestion(null);
            setDefaultSection(null);
          }}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

export default QuestionsHub;
