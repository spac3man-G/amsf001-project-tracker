/**
 * GapAnalysisResults Component
 * 
 * Displays the results of an AI gap analysis, showing coverage analysis,
 * identified gaps, and suggested requirements that users can add.
 * 
 * @version 1.0
 * @created January 4, 2026
 * @phase Phase 8A - Document Parsing & Gap Analysis (Task 8A.6)
 */

import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  X,
  BarChart2,
  AlertCircle,
  Info,
  ArrowRight,
  Filter
} from 'lucide-react';
import PropTypes from 'prop-types';
import './GapAnalysisResults.css';

const PRIORITY_CONFIG = {
  must_have: { label: 'Must Have', color: 'red', order: 1 },
  should_have: { label: 'Should Have', color: 'orange', order: 2 },
  could_have: { label: 'Could Have', color: 'blue', order: 3 }
};

const ASSESSMENT_CONFIG = {
  excellent: { label: 'Excellent', color: 'green', icon: CheckCircle },
  good: { label: 'Good', color: 'teal', icon: Check },
  adequate: { label: 'Adequate', color: 'blue', icon: Info },
  weak: { label: 'Weak', color: 'orange', icon: AlertCircle },
  missing: { label: 'Missing', color: 'red', icon: AlertTriangle }
};

function CoverageGauge({ score }) {
  const getColorClass = () => {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'adequate';
    if (score >= 20) return 'weak';
    return 'poor';
  };

  return (
    <div className="coverage-gauge">
      <svg viewBox="0 0 100 50" className="gauge-svg">
        <path d="M 5 50 A 45 45 0 0 1 95 50" fill="none" stroke="#e5e7eb" strokeWidth="8" strokeLinecap="round" />
        <path d="M 5 50 A 45 45 0 0 1 95 50" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${score * 1.41} 141`} className={`gauge-value ${getColorClass()}`} />
      </svg>
      <div className="gauge-text">
        <span className="gauge-score">{Math.round(score)}%</span>
        <span className="gauge-label">Coverage</span>
      </div>
    </div>
  );
}

function CategoryCoverageCard({ category }) {
  const config = ASSESSMENT_CONFIG[category.assessment] || ASSESSMENT_CONFIG.adequate;
  const IconComponent = config.icon;

  return (
    <div className={`category-card assessment-${config.color}`}>
      <div className="category-header">
        <IconComponent size={16} className="assessment-icon" />
        <span className="category-name">{category.category}</span>
        <span className="category-count">{category.requirement_count} reqs</span>
      </div>
      <div className="coverage-bar-mini">
        <div className={`bar-fill ${config.color}`} style={{ width: `${category.coverage_score}%` }} />
      </div>
      <div className="category-footer">
        <span className="coverage-score">{category.coverage_score}%</span>
        <span className={`assessment-badge ${config.color}`}>{config.label}</span>
      </div>
      {category.notes && <p className="category-notes">{category.notes}</p>}
    </div>
  );
}

function SuggestedRequirementCard({ suggestion, index, isSelected, isExpanded, onToggleSelect, onToggleExpand }) {
  const priorityConfig = PRIORITY_CONFIG[suggestion.priority] || PRIORITY_CONFIG.should_have;

  return (
    <div className={`suggestion-card ${isSelected ? 'selected' : ''}`}>
      <div className="suggestion-header">
        <button className="select-checkbox" onClick={() => onToggleSelect(index)}>
          {isSelected ? <CheckCircle className="checked" size={20} /> : <Plus size={20} />}
        </button>
        <div className="suggestion-title-area">
          <h4 className="suggestion-title">{suggestion.title}</h4>
          <div className="suggestion-badges">
            <span className={`badge priority-${priorityConfig.color}`}>{priorityConfig.label}</span>
            {suggestion.category_suggestion && <span className="badge category">{suggestion.category_suggestion}</span>}
          </div>
        </div>
        <button className="expand-btn" onClick={() => onToggleExpand(index)}>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>
      {isExpanded && (
        <div className="suggestion-details">
          <div className="detail-section">
            <label>Description</label>
            <p>{suggestion.description}</p>
          </div>
          <div className="detail-section gap-section">
            <label><AlertTriangle size={14} /> Gap Addressed</label>
            <p>{suggestion.gap_addressed}</p>
          </div>
          <div className="detail-section">
            <label><Lightbulb size={14} /> Rationale</label>
            <p>{suggestion.rationale}</p>
          </div>
          {suggestion.industry_reference && (
            <div className="detail-section">
              <label><Target size={14} /> Industry Reference</label>
              <p className="reference">{suggestion.industry_reference}</p>
            </div>
          )}
          {suggestion.confidence && (
            <div className="confidence-indicator">
              <span className="confidence-label">AI Confidence:</span>
              <span className="confidence-value">{Math.round(suggestion.confidence * 100)}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function GapAnalysisResults({ isOpen, onClose, analysisResults, categories = [], onAddRequirements }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  const [expandedIndices, setExpandedIndices] = useState(new Set());
  const [filterPriority, setFilterPriority] = useState('all');
  const [adding, setAdding] = useState(false);

  const suggestions = analysisResults?.suggested_requirements || [];
  const coverageAnalysis = analysisResults?.coverage_analysis || {};
  
  const filteredSuggestions = useMemo(() => {
    if (filterPriority === 'all') return suggestions;
    return suggestions.filter(s => s.priority === filterPriority);
  }, [suggestions, filterPriority]);

  const handleToggleSelect = (index) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleToggleExpand = (index) => {
    setExpandedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIndices.size === filteredSuggestions.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(filteredSuggestions.map((_, i) => i)));
    }
  };

  const handleAddSelected = async () => {
    if (selectedIndices.size === 0) return;
    setAdding(true);
    try {
      const selectedSuggestions = suggestions.filter((_, i) => selectedIndices.has(i));
      await onAddRequirements(selectedSuggestions);
      setSelectedIndices(new Set());
      onClose();
    } catch (error) {
      console.error('Failed to add requirements:', error);
    } finally {
      setAdding(false);
    }
  };

  if (!isOpen || !analysisResults) return null;

  return (
    <div className="gap-analysis-overlay">
      <div className="gap-analysis-modal">
        <div className="modal-header">
          <div className="header-title">
            <Sparkles className="ai-icon" />
            <div>
              <h2>Gap Analysis Results</h2>
              <p className="subtitle">AI-powered requirements coverage analysis</p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="tab-bar">
          <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <BarChart2 size={16} /> Overview
          </button>
          <button className={`tab ${activeTab === 'suggestions' ? 'active' : ''}`} onClick={() => setActiveTab('suggestions')}>
            <Lightbulb size={16} /> Suggestions ({suggestions.length})
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'overview' && (
            <div className="overview-content">
              <div className="coverage-section">
                <CoverageGauge score={coverageAnalysis.overall_score || 0} />
                <div className="summary-text"><p>{analysisResults.analysis_summary}</p></div>
              </div>

              <div className="stats-row">
                <div className="stat-card">
                  <span className="stat-value">{analysisResults.statistics?.total_existing || 0}</span>
                  <span className="stat-label">Existing Requirements</span>
                </div>
                <div className="stat-card highlight">
                  <span className="stat-value">{analysisResults.statistics?.total_suggested || suggestions.length}</span>
                  <span className="stat-label">Suggested Additions</span>
                </div>
                <div className="stat-card">
                  <span className="stat-value">{analysisResults.statistics?.categories_covered || 0}</span>
                  <span className="stat-label">Categories Covered</span>
                </div>
                <div className="stat-card warning">
                  <span className="stat-value">{analysisResults.statistics?.categories_missing || 0}</span>
                  <span className="stat-label">Categories Missing</span>
                </div>
              </div>

              {coverageAnalysis.by_category?.length > 0 && (
                <div className="categories-section">
                  <h3>Coverage by Category</h3>
                  <div className="categories-grid">
                    {coverageAnalysis.by_category.map((cat, i) => <CategoryCoverageCard key={i} category={cat} />)}
                  </div>
                </div>
              )}

              <div className="insights-grid">
                {coverageAnalysis.strengths?.length > 0 && (
                  <div className="insight-card strengths">
                    <h4><TrendingUp size={16} /> Strengths</h4>
                    <ul>{coverageAnalysis.strengths.map((s, i) => <li key={i}><Check size={14} />{s}</li>)}</ul>
                  </div>
                )}
                {coverageAnalysis.critical_gaps?.length > 0 && (
                  <div className="insight-card gaps">
                    <h4><AlertTriangle size={16} /> Critical Gaps</h4>
                    <ul>{coverageAnalysis.critical_gaps.map((g, i) => <li key={i}><AlertCircle size={14} />{g}</li>)}</ul>
                  </div>
                )}
              </div>

              {analysisResults.recommendations?.length > 0 && (
                <div className="recommendations-section">
                  <h3>Recommendations</h3>
                  <div className="recommendations-list">
                    {analysisResults.recommendations.map((rec, i) => (
                      <div key={i} className="recommendation-item">
                        <span className="rec-number">{i + 1}</span>
                        <p>{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'suggestions' && (
            <div className="suggestions-content">
              <div className="suggestions-toolbar">
                <div className="filter-group">
                  <Filter size={16} />
                  <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
                    <option value="all">All Priorities</option>
                    <option value="must_have">Must Have</option>
                    <option value="should_have">Should Have</option>
                    <option value="could_have">Could Have</option>
                  </select>
                </div>
                <div className="bulk-actions">
                  <button className="btn-text" onClick={handleSelectAll}>
                    {selectedIndices.size === filteredSuggestions.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span className="selected-count">{selectedIndices.size} selected</span>
                </div>
              </div>

              <div className="suggestions-list">
                {filteredSuggestions.length === 0 ? (
                  <div className="empty-state"><Lightbulb size={48} /><p>No suggestions match the current filter</p></div>
                ) : (
                  filteredSuggestions.map((suggestion, index) => (
                    <SuggestedRequirementCard key={index} suggestion={suggestion} index={index}
                      isSelected={selectedIndices.has(index)} isExpanded={expandedIndices.has(index)}
                      onToggleSelect={handleToggleSelect} onToggleExpand={handleToggleExpand} />
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
          {activeTab === 'suggestions' && (
            <button className="btn-primary" onClick={handleAddSelected} disabled={selectedIndices.size === 0 || adding}>
              {adding ? 'Adding...' : (<>Add {selectedIndices.size} Requirement{selectedIndices.size !== 1 ? 's' : ''} <ArrowRight size={16} /></>)}
            </button>
          )}
          {activeTab === 'overview' && suggestions.length > 0 && (
            <button className="btn-primary" onClick={() => setActiveTab('suggestions')}>
              View Suggestions <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

GapAnalysisResults.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  analysisResults: PropTypes.object,
  categories: PropTypes.array,
  onAddRequirements: PropTypes.func.isRequired
};

export default GapAnalysisResults;
