/**
 * VendorIntelligencePanel
 *
 * Displays vendor intelligence data including financial health,
 * compliance, reviews, market data, and AI-generated viability assessment.
 *
 * @version 1.0
 * @created 09 January 2026
 * @phase Evaluator Product Roadmap v1.1 - Feature 1.5
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  TrendingUp,
  Shield,
  Star,
  Newspaper,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Users,
  Building2,
  Award,
  ExternalLink,
  Clock,
  Sparkles,
  Edit,
  AlertCircle,
  Info
} from 'lucide-react';
import {
  vendorIntelligenceService,
  VIABILITY_CONFIG,
  VIABILITY_RISK_LEVEL_CONFIG
} from '../../services/evaluator';
import { useAuth } from '../../contexts/AuthContext';
import './VendorIntelligencePanel.css';

export default function VendorIntelligencePanel({ vendorId, vendorName, onDataUpdate }) {
  const { user } = useAuth();
  const [intelligence, setIntelligence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [generatingAssessment, setGeneratingAssessment] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    financial: true,
    compliance: true,
    reviews: true,
    market: false,
    viability: true
  });
  const [editingSection, setEditingSection] = useState(null);

  // Load intelligence data
  const loadIntelligence = useCallback(async () => {
    if (!vendorId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await vendorIntelligenceService.getByVendorId(vendorId);
      setIntelligence(data);
    } catch (err) {
      console.error('Failed to load vendor intelligence:', err);
      setError('Failed to load intelligence data');
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    loadIntelligence();
  }, [loadIntelligence]);

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Request data refresh
  const handleRefresh = async () => {
    if (!user?.id) return;

    try {
      setRefreshing(true);
      await vendorIntelligenceService.requestRefresh(vendorId, user.id);
      await loadIntelligence();
      onDataUpdate?.();
    } catch (err) {
      console.error('Failed to request refresh:', err);
      setError('Failed to request data refresh');
    } finally {
      setRefreshing(false);
    }
  };

  // Generate AI viability assessment
  const handleGenerateAssessment = async () => {
    if (!user?.id) return;

    try {
      setGeneratingAssessment(true);
      setError(null);

      const response = await fetch('/api/evaluator/vendor-intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId,
          userId: user.id
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate assessment');
      }

      await loadIntelligence();
      onDataUpdate?.();
    } catch (err) {
      console.error('Failed to generate assessment:', err);
      setError(err.message || 'Failed to generate viability assessment');
    } finally {
      setGeneratingAssessment(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="vendor-intelligence-panel loading">
        <RefreshCw size={24} className="spinning" />
        <span>Loading intelligence data...</span>
      </div>
    );
  }

  // Render error state
  if (error && !intelligence) {
    return (
      <div className="vendor-intelligence-panel error">
        <AlertCircle size={24} />
        <span>{error}</span>
        <button onClick={loadIntelligence}>Retry</button>
      </div>
    );
  }

  const viabilityConfig = intelligence?.viability_config;
  const riskConfig = intelligence?.risk_config;

  return (
    <div className="vendor-intelligence-panel">
      {/* Header */}
      <div className="intel-panel-header">
        <div className="intel-header-title">
          <TrendingUp size={20} />
          <h3>Vendor Intelligence</h3>
          {intelligence?.is_stale && (
            <span className="stale-badge">
              <Clock size={12} />
              Stale
            </span>
          )}
        </div>
        <div className="intel-header-actions">
          <span className="completeness-badge">
            {intelligence?.data_completeness || 0}% complete
          </span>
          <button
            className="intel-refresh-btn"
            onClick={handleRefresh}
            disabled={refreshing}
            title="Request data refresh"
          >
            <RefreshCw size={16} className={refreshing ? 'spinning' : ''} />
          </button>
        </div>
      </div>

      {error && (
        <div className="intel-error-banner">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Viability Summary (if available) */}
      {intelligence?.has_viability_assessment && (
        <div className="intel-viability-summary">
          <div className="viability-score-ring">
            <svg viewBox="0 0 36 36">
              <path
                className="score-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="score-fill"
                strokeDasharray={`${intelligence.viability_assessment.overall_score}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                style={{
                  stroke: getScoreColor(intelligence.viability_assessment.overall_score)
                }}
              />
            </svg>
            <div className="score-text">
              <span className="score-value">{intelligence.viability_assessment.overall_score}</span>
              <span className="score-label">Viability</span>
            </div>
          </div>
          <div className="viability-recommendation">
            {viabilityConfig && (
              <span
                className="recommendation-badge"
                style={{
                  backgroundColor: viabilityConfig.bgColor,
                  color: viabilityConfig.color
                }}
              >
                {getRecommendationIcon(intelligence.viability_assessment.recommendation)}
                {viabilityConfig.label}
              </span>
            )}
            {intelligence.viability_assessment.generated_at && (
              <span className="generated-date">
                <Sparkles size={12} />
                AI assessed {formatRelativeDate(intelligence.viability_assessment.generated_at)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Generate Assessment Button */}
      {!intelligence?.has_viability_assessment && (
        <div className="generate-assessment-prompt">
          <Sparkles size={24} />
          <p>Generate an AI-powered viability assessment based on available intelligence data.</p>
          <button
            className="btn btn-primary"
            onClick={handleGenerateAssessment}
            disabled={generatingAssessment || intelligence?.data_completeness < 10}
          >
            {generatingAssessment ? (
              <>
                <RefreshCw size={16} className="spinning" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Assessment
              </>
            )}
          </button>
          {intelligence?.data_completeness < 10 && (
            <span className="prompt-hint">Add more data to enable assessment</span>
          )}
        </div>
      )}

      {/* Collapsible Sections */}
      <div className="intel-sections">
        {/* Financial Health */}
        <IntelSection
          title="Financial Health"
          icon={<DollarSign size={16} />}
          expanded={expandedSections.financial}
          onToggle={() => toggleSection('financial')}
          score={intelligence?.viability_assessment?.financial_health_score}
          hasData={intelligence?.has_financial_data}
        >
          <FinancialDataDisplay
            data={intelligence?.financial_data}
            onEdit={() => setEditingSection('financial')}
          />
        </IntelSection>

        {/* Compliance & Security */}
        <IntelSection
          title="Compliance & Security"
          icon={<Shield size={16} />}
          expanded={expandedSections.compliance}
          onToggle={() => toggleSection('compliance')}
          score={intelligence?.viability_assessment?.compliance_score}
          hasData={intelligence?.has_compliance_data}
          riskLevel={intelligence?.compliance_data?.risk_level}
        >
          <ComplianceDataDisplay
            data={intelligence?.compliance_data}
            onEdit={() => setEditingSection('compliance')}
          />
        </IntelSection>

        {/* Product Reviews */}
        <IntelSection
          title="Product Reviews"
          icon={<Star size={16} />}
          expanded={expandedSections.reviews}
          onToggle={() => toggleSection('reviews')}
          score={intelligence?.viability_assessment?.customer_satisfaction_score}
          hasData={intelligence?.has_review_data}
        >
          <ReviewDataDisplay
            data={intelligence?.review_data}
            onEdit={() => setEditingSection('reviews')}
          />
        </IntelSection>

        {/* Market Intelligence */}
        <IntelSection
          title="Market Intelligence"
          icon={<Newspaper size={16} />}
          expanded={expandedSections.market}
          onToggle={() => toggleSection('market')}
          score={intelligence?.viability_assessment?.market_position_score}
          hasData={intelligence?.has_market_data}
        >
          <MarketDataDisplay
            data={intelligence?.market_data}
            onEdit={() => setEditingSection('market')}
          />
        </IntelSection>

        {/* Full Viability Assessment */}
        {intelligence?.has_viability_assessment && (
          <IntelSection
            title="Viability Assessment"
            icon={<Sparkles size={16} />}
            expanded={expandedSections.viability}
            onToggle={() => toggleSection('viability')}
          >
            <ViabilityAssessmentDisplay
              data={intelligence?.viability_assessment}
              onRegenerate={handleGenerateAssessment}
              regenerating={generatingAssessment}
            />
          </IntelSection>
        )}
      </div>

      {/* Last Updated */}
      {intelligence?.last_refreshed_at && (
        <div className="intel-footer">
          <span>Last updated: {new Date(intelligence.last_refreshed_at).toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

VendorIntelligencePanel.propTypes = {
  vendorId: PropTypes.string.isRequired,
  vendorName: PropTypes.string,
  onDataUpdate: PropTypes.func
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function IntelSection({ title, icon, expanded, onToggle, score, hasData, riskLevel, children }) {
  return (
    <div className={`intel-section ${expanded ? 'expanded' : ''} ${hasData ? 'has-data' : 'no-data'}`}>
      <button className="intel-section-header" onClick={onToggle}>
        <div className="section-title">
          {icon}
          <span>{title}</span>
          {!hasData && <span className="no-data-badge">No data</span>}
        </div>
        <div className="section-meta">
          {score !== undefined && (
            <span className="section-score\" style={{ color: getScoreColor(score) }}>
              {score}
            </span>
          )}
          {riskLevel && (
            <span
              className={`risk-badge risk-${riskLevel}`}
              style={{
                backgroundColor: VIABILITY_RISK_LEVEL_CONFIG[riskLevel]?.bgColor,
                color: VIABILITY_RISK_LEVEL_CONFIG[riskLevel]?.color
              }}
            >
              {VIABILITY_RISK_LEVEL_CONFIG[riskLevel]?.label || riskLevel}
            </span>
          )}
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>
      {expanded && <div className="intel-section-content">{children}</div>}
    </div>
  );
}

function FinancialDataDisplay({ data, onEdit }) {
  if (!data || Object.keys(data).length === 0) {
    return <EmptyDataPrompt section="financial" onEdit={onEdit} />;
  }

  return (
    <div className="financial-data">
      <div className="data-grid">
        {data.funding_total && (
          <DataItem
            label="Total Funding"
            value={`$${(data.funding_total / 1000000).toFixed(1)}M`}
            icon={<DollarSign size={14} />}
          />
        )}
        {data.funding_stage && (
          <DataItem label="Stage" value={data.funding_stage} />
        )}
        {data.revenue_range && (
          <DataItem label="Revenue" value={data.revenue_range} />
        )}
        {data.employee_count && (
          <DataItem
            label="Employees"
            value={data.employee_count.toLocaleString()}
            icon={<Users size={14} />}
          />
        )}
        {data.employee_growth_yoy && (
          <DataItem
            label="YoY Growth"
            value={`${data.employee_growth_yoy > 0 ? '+' : ''}${data.employee_growth_yoy}%`}
            trend={data.employee_growth_yoy > 0 ? 'up' : 'down'}
          />
        )}
        {data.profitability_indicator && (
          <DataItem label="Profitability" value={data.profitability_indicator} />
        )}
      </div>
      {data.investors?.length > 0 && (
        <div className="investors-list">
          <span className="list-label">Key Investors:</span>
          {data.investors.map((inv, i) => (
            <span key={i} className="investor-tag">{inv}</span>
          ))}
        </div>
      )}
      {data.source && (
        <div className="data-source">
          Source: {data.source} • {data.fetched_at ? formatRelativeDate(data.fetched_at) : 'Manual entry'}
        </div>
      )}
    </div>
  );
}

function ComplianceDataDisplay({ data, onEdit }) {
  if (!data || Object.keys(data).length === 0) {
    return <EmptyDataPrompt section="compliance" onEdit={onEdit} />;
  }

  return (
    <div className="compliance-data">
      <div className="data-grid">
        {data.sanctions_check && (
          <DataItem
            label="Sanctions"
            value={data.sanctions_check}
            status={data.sanctions_check === 'clear' ? 'success' : 'warning'}
          />
        )}
        {data.compliance_score && (
          <DataItem
            label="Compliance Score"
            value={`${data.compliance_score}/100`}
            icon={<Shield size={14} />}
          />
        )}
      </div>
      {data.certifications?.length > 0 && (
        <div className="certifications-list">
          <span className="list-label">Certifications:</span>
          <div className="cert-tags">
            {data.certifications.map((cert, i) => (
              <span key={i} className="cert-tag">
                <CheckCircle size={12} />
                {cert}
              </span>
            ))}
          </div>
        </div>
      )}
      {data.data_breach_history?.length > 0 && (
        <div className="breach-warning">
          <AlertTriangle size={14} />
          {data.data_breach_history.length} data breach(es) on record
        </div>
      )}
    </div>
  );
}

function ReviewDataDisplay({ data, onEdit }) {
  if (!data || Object.keys(data).length === 0) {
    return <EmptyDataPrompt section="reviews" onEdit={onEdit} />;
  }

  return (
    <div className="review-data">
      {data.aggregate_rating && (
        <div className="aggregate-rating">
          <StarRating rating={data.aggregate_rating} />
          <span className="rating-text">{data.aggregate_rating}/5</span>
          <span className="review-count">({data.total_reviews || 0} reviews)</span>
        </div>
      )}

      <div className="review-sources">
        {data.g2 && (
          <ReviewSource
            name="G2"
            rating={data.g2.rating}
            count={data.g2.review_count}
            url={data.g2.url}
            extra={[
              { label: 'Satisfaction', value: `${data.g2.satisfaction_score}%` },
              { label: 'Support', value: `${data.g2.support_score}%` }
            ]}
          />
        )}
        {data.capterra && (
          <ReviewSource
            name="Capterra"
            rating={data.capterra.rating}
            count={data.capterra.review_count}
            url={data.capterra.url}
            extra={[
              { label: 'Ease of Use', value: `${data.capterra.ease_of_use}/5` },
              { label: 'Value', value: `${data.capterra.value_score}/5` }
            ]}
          />
        )}
        {data.gartner && (
          <ReviewSource
            name="Gartner"
            rating={data.gartner.peer_insights_rating}
            extra={[
              { label: 'Magic Quadrant', value: data.gartner.magic_quadrant_position },
              { label: 'Recommend', value: `${data.gartner.willingness_to_recommend}%` }
            ]}
          />
        )}
      </div>
    </div>
  );
}

function MarketDataDisplay({ data, onEdit }) {
  if (!data || Object.keys(data).length === 0) {
    return <EmptyDataPrompt section="market" onEdit={onEdit} />;
  }

  return (
    <div className="market-data">
      {data.sentiment_summary && (
        <div className={`sentiment-indicator sentiment-${data.sentiment_summary}`}>
          {getSentimentIcon(data.sentiment_summary)}
          <span>Overall sentiment: {data.sentiment_summary}</span>
        </div>
      )}

      {data.recent_news?.length > 0 && (
        <div className="news-list">
          <span className="list-label">Recent News:</span>
          {data.recent_news.slice(0, 3).map((news, i) => (
            <a
              key={i}
              href={news.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`news-item sentiment-${news.sentiment || 'neutral'}`}
            >
              <span className="news-title">{news.title}</span>
              <span className="news-meta">{news.source} • {news.published_at}</span>
            </a>
          ))}
        </div>
      )}

      {data.awards?.length > 0 && (
        <div className="awards-list">
          <span className="list-label">Awards:</span>
          {data.awards.map((award, i) => (
            <span key={i} className="award-tag">
              <Award size={12} />
              {award}
            </span>
          ))}
        </div>
      )}

      {data.partnerships?.length > 0 && (
        <div className="partnerships-list">
          <span className="list-label">Partnerships:</span>
          {data.partnerships.map((p, i) => (
            <span key={i} className="partner-tag">{p}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function ViabilityAssessmentDisplay({ data, onRegenerate, regenerating }) {
  if (!data) return null;

  return (
    <div className="viability-assessment">
      {/* Score Breakdown */}
      <div className="score-breakdown">
        <ScoreBar label="Financial Health" score={data.financial_health_score} />
        <ScoreBar label="Market Position" score={data.market_position_score} />
        <ScoreBar label="Compliance" score={data.compliance_score} />
        <ScoreBar label="Customer Satisfaction" score={data.customer_satisfaction_score} />
      </div>

      {/* Strengths */}
      {data.strengths?.length > 0 && (
        <div className="assessment-list strengths">
          <h4><CheckCircle size={14} /> Strengths</h4>
          <ul>
            {data.strengths.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}

      {/* Concerns */}
      {data.concerns?.length > 0 && (
        <div className="assessment-list concerns">
          <h4><AlertTriangle size={14} /> Concerns</h4>
          <ul>
            {data.concerns.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </div>
      )}

      {/* Risk Factors */}
      {data.risk_factors?.length > 0 && (
        <div className="risk-factors">
          <h4><AlertCircle size={14} /> Risk Factors</h4>
          {data.risk_factors.map((risk, i) => (
            <div key={i} className={`risk-factor severity-${risk.severity}`}>
              <span className="risk-severity">{risk.severity}</span>
              <span className="risk-text">{risk.factor}</span>
              {risk.mitigation && (
                <span className="risk-mitigation">Mitigation: {risk.mitigation}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recommendation */}
      {data.recommendation_rationale && (
        <div className="recommendation-rationale">
          <h4><Info size={14} /> Assessment Rationale</h4>
          <p>{data.recommendation_rationale}</p>
        </div>
      )}

      {/* Due Diligence */}
      {data.due_diligence_suggestions?.length > 0 && (
        <div className="due-diligence">
          <h4><Eye size={14} /> Suggested Due Diligence</h4>
          <ul>
            {data.due_diligence_suggestions.map((s, i) => <li key={i}>{s}</li>)}
          </ul>
        </div>
      )}

      {/* Data Gaps */}
      {data.data_gaps?.length > 0 && (
        <div className="data-gaps">
          <h4><AlertCircle size={14} /> Data Gaps</h4>
          <ul>
            {data.data_gaps.map((g, i) => <li key={i}>{g}</li>)}
          </ul>
        </div>
      )}

      {/* Regenerate Button */}
      <button
        className="regenerate-btn"
        onClick={onRegenerate}
        disabled={regenerating}
      >
        {regenerating ? (
          <>
            <RefreshCw size={14} className="spinning" />
            Regenerating...
          </>
        ) : (
          <>
            <Sparkles size={14} />
            Regenerate Assessment
          </>
        )}
      </button>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function DataItem({ label, value, icon, trend, status }) {
  return (
    <div className={`data-item ${status || ''} ${trend || ''}`}>
      {icon}
      <span className="item-label">{label}</span>
      <span className="item-value">{value}</span>
    </div>
  );
}

function EmptyDataPrompt({ section, onEdit }) {
  const prompts = {
    financial: 'Add funding, revenue, and employee data',
    compliance: 'Add certifications and compliance status',
    reviews: 'Add G2, Capterra, or Gartner ratings',
    market: 'Add news, partnerships, and market presence'
  };

  return (
    <div className="empty-data-prompt">
      <Info size={16} />
      <span>{prompts[section] || 'No data available'}</span>
      <button className="add-data-btn" onClick={onEdit}>
        <Edit size={14} />
        Add Data
      </button>
    </div>
  );
}

function StarRating({ rating }) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(<Star key={i} size={14} className="star filled" />);
    } else if (i === fullStars && hasHalf) {
      stars.push(<Star key={i} size={14} className="star half" />);
    } else {
      stars.push(<Star key={i} size={14} className="star empty" />);
    }
  }

  return <div className="star-rating">{stars}</div>;
}

function ReviewSource({ name, rating, count, url, extra }) {
  return (
    <div className="review-source">
      <div className="source-header">
        <span className="source-name">{name}</span>
        {rating && (
          <>
            <StarRating rating={rating} />
            <span className="source-rating">{rating}</span>
          </>
        )}
        {count && <span className="source-count">({count})</span>}
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={12} />
          </a>
        )}
      </div>
      {extra?.length > 0 && (
        <div className="source-extra">
          {extra.filter(e => e.value).map((e, i) => (
            <span key={i}>{e.label}: {e.value}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function ScoreBar({ label, score }) {
  return (
    <div className="score-bar">
      <div className="score-bar-header">
        <span className="score-bar-label">{label}</span>
        <span className="score-bar-value" style={{ color: getScoreColor(score) }}>
          {score}
        </span>
      </div>
      <div className="score-bar-track">
        <div
          className="score-bar-fill"
          style={{
            width: `${score}%`,
            backgroundColor: getScoreColor(score)
          }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getScoreColor(score) {
  if (score >= 85) return '#10b981';
  if (score >= 70) return '#3b82f6';
  if (score >= 55) return '#f59e0b';
  if (score >= 40) return '#ef4444';
  return '#7f1d1d';
}

function getRecommendationIcon(recommendation) {
  switch (recommendation) {
    case 'recommended':
      return <CheckCircle size={14} />;
    case 'proceed_with_caution':
      return <AlertTriangle size={14} />;
    case 'requires_review':
      return <Eye size={14} />;
    case 'not_recommended':
      return <XCircle size={14} />;
    default:
      return null;
  }
}

function getSentimentIcon(sentiment) {
  switch (sentiment) {
    case 'positive':
      return <TrendingUp size={14} className="sentiment-positive" />;
    case 'negative':
      return <AlertTriangle size={14} className="sentiment-negative" />;
    default:
      return <Info size={14} className="sentiment-neutral" />;
  }
}

function formatRelativeDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}
