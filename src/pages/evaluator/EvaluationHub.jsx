/**
 * EvaluationHub Page
 * 
 * Main hub for evaluation and scoring activities.
 * Allows evaluators to score vendors and view reconciliation.
 * 
 * @version 1.0
 * @created 03 January 2026
 * @phase Phase 6 - Evaluation & Scoring (Task 6B.2)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ClipboardCheck,
  Star,
  Users,
  Building2,
  RefreshCw,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  FileText,
  Plus,
  Filter
} from 'lucide-react';
import { useEvaluation } from '../../contexts/EvaluationContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  vendorsService,
  evaluationCategoriesService,
  scoresService,
  evidenceService,
  VENDOR_STATUSES
} from '../../services/evaluator';
import { 
  ScoringInterface,
  EvidenceCard,
  EvidenceForm,
  ReconciliationPanel
} from '../../components/evaluator';
import './EvaluationHub.css';

// View modes
const VIEW_MODES = {
  OVERVIEW: 'overview',
  SCORING: 'scoring',
  RECONCILIATION: 'reconciliation',
  EVIDENCE: 'evidence'
};

function EvaluationHub() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentEvaluation } = useEvaluation();
  const { user } = useAuth();

  // State
  const [viewMode, setViewMode] = useState(VIEW_MODES.OVERVIEW);
  const [vendors, setVendors] = useState([]);
  const [categories, setCategories] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedCriterion, setSelectedCriterion] = useState(null);
  const [vendorProgress, setVendorProgress] = useState({});
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showEvidenceForm, setShowEvidenceForm] = useState(false);
  const [editingEvidence, setEditingEvidence] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle URL params
  useEffect(() => {
    const mode = searchParams.get('mode');
    const vendorId = searchParams.get('vendor');
    if (mode && Object.values(VIEW_MODES).includes(mode)) {
      setViewMode(mode);
    }
    if (vendorId) {
      setSelectedVendor(vendors.find(v => v.id === vendorId) || null);
    }
  }, [searchParams, vendors]);

  // Fetch data
  const fetchData = useCallback(async () => {
    if (!currentEvaluation?.id) return;

    try {
      setLoading(true);
      setError(null);

      const [vendorsData, categoriesData, evidenceData] = await Promise.all([
        vendorsService.getAll(currentEvaluation.id),
        evaluationCategoriesService.getAllWithCriteria(currentEvaluation.id),
        evidenceService.getAllWithDetails(currentEvaluation.id)
      ]);

      // Filter to vendors in evaluation stage
      const evaluableVendors = vendorsData.filter(v =>
        [VENDOR_STATUSES.UNDER_EVALUATION, VENDOR_STATUSES.SHORT_LIST].includes(v.status)
      );

      setVendors(evaluableVendors);
      setCategories(categoriesData);
      setEvidence(evidenceData);

      // Get progress for each vendor
      if (user?.id) {
        const progressMap = {};
        await Promise.all(
          evaluableVendors.map(async (vendor) => {
            const progress = await scoresService.getScoringProgress(vendor.id, user.id);
            progressMap[vendor.id] = progress;
          })
        );
        setVendorProgress(progressMap);
      }

      // Get ranking
      try {
        const rankingData = await scoresService.getVendorRanking(currentEvaluation.id);
        setRanking(rankingData);
      } catch (rankError) {
        console.error('Failed to get ranking:', rankError);
      }

    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load evaluation data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentEvaluation?.id, user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers
  const handleVendorSelect = (vendor) => {
    setSelectedVendor(vendor);
    setViewMode(VIEW_MODES.SCORING);
    setSearchParams({ mode: VIEW_MODES.SCORING, vendor: vendor.id });
  };

  const handleBackToOverview = () => {
    setSelectedVendor(null);
    setSelectedCriterion(null);
    setViewMode(VIEW_MODES.OVERVIEW);
    setSearchParams({});
  };

  const handleAddEvidence = (vendor = null) => {
    setSelectedVendor(vendor || selectedVendor);
    setEditingEvidence(null);
    setShowEvidenceForm(true);
  };

  const handleEditEvidence = (evidenceItem) => {
    setEditingEvidence(evidenceItem);
    setShowEvidenceForm(true);
  };

  const handleSubmitEvidence = async (formData) => {
    try {
      setIsSubmitting(true);

      if (editingEvidence) {
        await evidenceService.updateEvidence(editingEvidence.id, formData);
      } else {
        await evidenceService.createEvidence({
          ...formData,
          created_by: user?.id
        });
      }

      setShowEvidenceForm(false);
      setEditingEvidence(null);
      fetchData();
    } catch (err) {
      console.error('Failed to save evidence:', err);
      setError('Failed to save evidence. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvidence = async (evidenceItem) => {
    if (!confirm('Are you sure you want to delete this evidence?')) return;

    try {
      await evidenceService.delete(evidenceItem.id, user?.id);
      fetchData();
    } catch (err) {
      console.error('Failed to delete evidence:', err);
      setError('Failed to delete evidence.');
    }
  };

  // Flatten criteria for linking
  const allCriteria = categories.flatMap(cat => 
    (cat.criteria || []).map(c => ({
      ...c,
      categoryName: cat.name
    }))
  );

  // Get stats
  const totalCriteria = categories.reduce((sum, cat) => sum + (cat.criteria?.length || 0), 0);
  const scoredVendors = Object.values(vendorProgress).filter(p => p.percentComplete === 100).length;

  if (!currentEvaluation) {
    return (
      <div className="evaluation-hub">
        <div className="evaluation-hub-empty">
          <ClipboardCheck size={48} />
          <h2>No Evaluation Selected</h2>
          <p>Please select an evaluation project to begin scoring.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="evaluation-hub">
      {/* Header */}
      <div className="evaluation-hub-header">
        <div className="evaluation-hub-title-section">
          {viewMode !== VIEW_MODES.OVERVIEW && (
            <button 
              className="evaluation-hub-back"
              onClick={handleBackToOverview}
            >
              ← Back to Overview
            </button>
          )}
          <h1>
            <ClipboardCheck size={24} />
            {viewMode === VIEW_MODES.OVERVIEW && 'Evaluation & Scoring'}
            {viewMode === VIEW_MODES.SCORING && `Score: ${selectedVendor?.name}`}
            {viewMode === VIEW_MODES.RECONCILIATION && 'Score Reconciliation'}
            {viewMode === VIEW_MODES.EVIDENCE && 'Evidence Management'}
          </h1>
          <p className="evaluation-hub-subtitle">
            {currentEvaluation.name}
          </p>
        </div>

        <div className="evaluation-hub-actions">
          {viewMode === VIEW_MODES.OVERVIEW && (
            <>
              <button 
                className="evaluation-hub-btn evaluation-hub-btn-secondary"
                onClick={() => setViewMode(VIEW_MODES.EVIDENCE)}
              >
                <FileText size={16} />
                Evidence
              </button>
              <button 
                className="evaluation-hub-btn evaluation-hub-btn-secondary"
                onClick={() => setViewMode(VIEW_MODES.RECONCILIATION)}
              >
                <Users size={16} />
                Reconciliation
              </button>
            </>
          )}
          <button 
            className="evaluation-hub-btn evaluation-hub-btn-secondary"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="evaluation-hub-error">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Main Content */}
      <div className="evaluation-hub-content">
        {viewMode === VIEW_MODES.OVERVIEW && (
          <OverviewView
            vendors={vendors}
            vendorProgress={vendorProgress}
            ranking={ranking}
            totalCriteria={totalCriteria}
            evidence={evidence}
            onVendorSelect={handleVendorSelect}
            onAddEvidence={handleAddEvidence}
            loading={loading}
          />
        )}

        {viewMode === VIEW_MODES.SCORING && selectedVendor && (
          <ScoringInterface
            vendor={selectedVendor}
            evaluator={user}
            categories={categories}
            evaluationProjectId={currentEvaluation.id}
            onScoreChange={fetchData}
          />
        )}

        {viewMode === VIEW_MODES.RECONCILIATION && (
          <ReconciliationView
            vendors={vendors}
            categories={categories}
            evaluationProjectId={currentEvaluation.id}
            currentUserId={user?.id}
            onRefresh={fetchData}
          />
        )}

        {viewMode === VIEW_MODES.EVIDENCE && (
          <EvidenceView
            evidence={evidence}
            vendors={vendors}
            onAddEvidence={handleAddEvidence}
            onEditEvidence={handleEditEvidence}
            onDeleteEvidence={handleDeleteEvidence}
          />
        )}
      </div>

      {/* Evidence Form Modal */}
      {showEvidenceForm && (
        <EvidenceForm
          evidence={editingEvidence}
          vendorId={selectedVendor?.id}
          vendorName={selectedVendor?.name}
          evaluationProjectId={currentEvaluation.id}
          requirements={[]} // Would fetch from requirements service
          criteria={allCriteria}
          onSubmit={handleSubmitEvidence}
          onCancel={() => {
            setShowEvidenceForm(false);
            setEditingEvidence(null);
          }}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

/**
 * Overview View Component
 */
function OverviewView({ 
  vendors, 
  vendorProgress, 
  ranking,
  totalCriteria,
  evidence,
  onVendorSelect,
  onAddEvidence,
  loading 
}) {
  if (loading) {
    return (
      <div className="evaluation-hub-loading">
        <div className="spinner" />
        <span>Loading evaluation data...</span>
      </div>
    );
  }

  if (vendors.length === 0) {
    return (
      <div className="evaluation-hub-empty-state">
        <Building2 size={48} />
        <h3>No Vendors to Evaluate</h3>
        <p>Move vendors to "Under Evaluation" status to begin scoring.</p>
      </div>
    );
  }

  return (
    <div className="evaluation-overview">
      {/* Stats Cards */}
      <div className="evaluation-stats-grid">
        <div className="evaluation-stat-card">
          <Building2 size={24} />
          <div className="evaluation-stat-info">
            <span className="evaluation-stat-value">{vendors.length}</span>
            <span className="evaluation-stat-label">Vendors to Evaluate</span>
          </div>
        </div>
        <div className="evaluation-stat-card">
          <Star size={24} />
          <div className="evaluation-stat-info">
            <span className="evaluation-stat-value">{totalCriteria}</span>
            <span className="evaluation-stat-label">Evaluation Criteria</span>
          </div>
        </div>
        <div className="evaluation-stat-card">
          <FileText size={24} />
          <div className="evaluation-stat-info">
            <span className="evaluation-stat-value">{evidence.length}</span>
            <span className="evaluation-stat-label">Evidence Items</span>
          </div>
        </div>
        <div className="evaluation-stat-card">
          <TrendingUp size={24} />
          <div className="evaluation-stat-info">
            <span className="evaluation-stat-value">
              {ranking.length > 0 && ranking[0].score > 0 
                ? `${ranking[0].score.toFixed(0)}%` 
                : '-'
              }
            </span>
            <span className="evaluation-stat-label">Top Score</span>
          </div>
        </div>
      </div>

      {/* Vendors to Score */}
      <div className="evaluation-section">
        <h3>
          <ClipboardCheck size={18} />
          Vendors to Score
        </h3>
        <div className="evaluation-vendor-list">
          {vendors.map(vendor => {
            const progress = vendorProgress[vendor.id] || { percentComplete: 0, scored: 0, totalCriteria };
            const rankInfo = ranking.find(r => r.vendor?.id === vendor.id);

            return (
              <div 
                key={vendor.id} 
                className="evaluation-vendor-card"
                onClick={() => onVendorSelect(vendor)}
              >
                <div className="evaluation-vendor-info">
                  <h4>{vendor.name}</h4>
                  <span className="evaluation-vendor-status">{vendor.status}</span>
                </div>

                <div className="evaluation-vendor-progress">
                  <div className="progress-text">
                    {progress.scored}/{progress.totalCriteria} scored
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${progress.percentComplete}%` }}
                    />
                  </div>
                </div>

                {rankInfo && rankInfo.score > 0 && (
                  <div className="evaluation-vendor-score">
                    <Star size={14} />
                    {rankInfo.score.toFixed(0)}%
                    {rankInfo.rank && (
                      <span className="evaluation-vendor-rank">#{rankInfo.rank}</span>
                    )}
                  </div>
                )}

                <ChevronRight size={18} className="evaluation-vendor-arrow" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Evidence */}
      {evidence.length > 0 && (
        <div className="evaluation-section">
          <div className="evaluation-section-header">
            <h3>
              <FileText size={18} />
              Recent Evidence
            </h3>
            <button 
              className="evaluation-add-btn"
              onClick={() => onAddEvidence()}
            >
              <Plus size={16} />
              Add Evidence
            </button>
          </div>
          <div className="evaluation-evidence-grid">
            {evidence.slice(0, 4).map(ev => (
              <EvidenceCard
                key={ev.id}
                evidence={ev}
                compact
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Reconciliation View Component
 */
function ReconciliationView({ 
  vendors, 
  categories,
  evaluationProjectId,
  currentUserId,
  onRefresh
}) {
  const [selectedVendor, setSelectedVendor] = useState(vendors[0] || null);
  const [selectedCriterion, setSelectedCriterion] = useState(null);

  const allCriteria = categories.flatMap(cat => 
    (cat.criteria || []).map(c => ({ ...c, categoryName: cat.name }))
  );

  useEffect(() => {
    if (allCriteria.length > 0 && !selectedCriterion) {
      setSelectedCriterion(allCriteria[0]);
    }
  }, [allCriteria]);

  return (
    <div className="reconciliation-view">
      <div className="reconciliation-sidebar">
        <div className="reconciliation-vendor-select">
          <label>Vendor</label>
          <select 
            value={selectedVendor?.id || ''}
            onChange={e => setSelectedVendor(vendors.find(v => v.id === e.target.value))}
          >
            {vendors.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>

        <div className="reconciliation-criteria-list">
          <label>Criteria</label>
          {allCriteria.map(criterion => (
            <button
              key={criterion.id}
              className={`reconciliation-criterion-btn ${selectedCriterion?.id === criterion.id ? 'active' : ''}`}
              onClick={() => setSelectedCriterion(criterion)}
            >
              <span className="criterion-name">{criterion.name}</span>
              <span className="criterion-category">{criterion.categoryName}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="reconciliation-main">
        {selectedVendor && selectedCriterion ? (
          <ReconciliationPanel
            vendor={selectedVendor}
            criterion={selectedCriterion}
            evaluationProjectId={evaluationProjectId}
            currentUserId={currentUserId}
            onConsensusReached={onRefresh}
          />
        ) : (
          <div className="reconciliation-empty">
            <Users size={48} />
            <p>Select a vendor and criterion to view score reconciliation.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Evidence View Component
 */
function EvidenceView({ 
  evidence, 
  vendors,
  onAddEvidence,
  onEditEvidence,
  onDeleteEvidence
}) {
  const [vendorFilter, setVendorFilter] = useState('all');
  const [menuEvidence, setMenuEvidence] = useState(null);

  const filteredEvidence = vendorFilter === 'all' 
    ? evidence 
    : evidence.filter(e => e.vendor_id === vendorFilter);

  return (
    <div className="evidence-view">
      <div className="evidence-view-header">
        <div className="evidence-view-filters">
          <Filter size={16} />
          <select 
            value={vendorFilter}
            onChange={e => setVendorFilter(e.target.value)}
          >
            <option value="all">All Vendors</option>
            {vendors.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>

        <button 
          className="evidence-view-add-btn"
          onClick={() => onAddEvidence(vendors.find(v => v.id === vendorFilter) || vendors[0])}
        >
          <Plus size={16} />
          Add Evidence
        </button>
      </div>

      {filteredEvidence.length === 0 ? (
        <div className="evidence-view-empty">
          <FileText size={48} />
          <h3>No Evidence Yet</h3>
          <p>Add evidence to support your scoring decisions.</p>
          <button onClick={() => onAddEvidence(vendors[0])}>
            <Plus size={16} />
            Add First Evidence
          </button>
        </div>
      ) : (
        <div className="evidence-view-grid">
          {filteredEvidence.map(ev => (
            <EvidenceCard
              key={ev.id}
              evidence={ev}
              onClick={() => onEditEvidence(ev)}
              onMenuClick={(e, event) => {
                event.stopPropagation();
                setMenuEvidence(ev);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default EvaluationHub;
