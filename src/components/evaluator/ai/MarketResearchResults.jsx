/**
 * MarketResearchResults Component
 * 
 * Displays the results of AI-powered market research, showing market overview,
 * vendor recommendations, and allowing users to add vendors to their list.
 * 
 * @version 1.0
 * @created January 4, 2026
 * @phase Phase 8B - Market Research & AI Assistant (Task 8B.2)
 */

import React, { useState, useMemo } from 'react';
import { 
  Award,
  Building2,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Filter,
  Globe,
  Lightbulb,
  Plus,
  Search,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  X,
  ArrowRight,
  AlertCircle,
  BarChart2,
  Users,
  Zap
} from 'lucide-react';
import PropTypes from 'prop-types';
import './MarketResearchResults.css';

const MARKET_POSITION_CONFIG = {
  leader: { 
    label: 'Market Leader', 
    color: 'purple', 
    icon: Award,
    description: 'Established vendor with significant market share'
  },
  challenger: { 
    label: 'Challenger', 
    color: 'blue', 
    icon: TrendingUp,
    description: 'Strong competitor aiming to displace leaders'
  },
  niche: { 
    label: 'Niche Player', 
    color: 'teal', 
    icon: Target,
    description: 'Specialized vendor excelling in specific domains'
  },
  emerging: { 
    label: 'Emerging', 
    color: 'green', 
    icon: Zap,
    description: 'Newer entrant with promising capabilities'
  }
};

const TARGET_MARKET_CONFIG = {
  enterprise: { label: 'Enterprise', color: 'purple' },
  mid_market: { label: 'Mid-Market', color: 'blue' },
  smb: { label: 'SMB', color: 'teal' },
  all_segments: { label: 'All Segments', color: 'green' }
};

const MARKET_SIZE_CONFIG = {
  emerging: { label: 'Emerging', color: 'green', description: 'New market with high growth potential' },
  growing: { label: 'Growing', color: 'blue', description: 'Expanding market with increasing adoption' },
  mature: { label: 'Mature', color: 'purple', description: 'Established market with stable growth' },
  consolidating: { label: 'Consolidating', color: 'orange', description: 'Market undergoing vendor consolidation' }
};

function FitScoreGauge({ score }) {
  const getColorClass = () => {
    if (score >= 9) return 'excellent';
    if (score >= 7) return 'good';
    if (score >= 5) return 'moderate';
    return 'limited';
  };

  return (
    <div className="fit-score-gauge">
      <div className="gauge-circle">
        <svg viewBox="0 0 36 36" className="circular-chart">
          <path className="circle-bg"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path className={`circle-fill ${getColorClass()}`}
            strokeDasharray={`${score * 10}, 100`}
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div className="gauge-text">{score}</div>
      </div>
      <span className="gauge-label">Fit</span>
    </div>
  );
}

function VendorCard({ vendor, index, isSelected, isExpanded, onToggleSelect, onToggleExpand }) {
  const positionConfig = MARKET_POSITION_CONFIG[vendor.market_position] || MARKET_POSITION_CONFIG.niche;
  const PositionIcon = positionConfig.icon;
  const targetConfig = TARGET_MARKET_CONFIG[vendor.target_market] || TARGET_MARKET_CONFIG.all_segments;

  return (
    <div className={`vendor-card ${isSelected ? 'selected' : ''}`}>
      <div className="vendor-header">
        <button className="select-checkbox" onClick={() => onToggleSelect(index)}>
          {isSelected ? <CheckCircle className="checked" size={20} /> : <Plus size={20} />}
        </button>
        
        <div className="vendor-main-info">
          <div className="vendor-title-row">
            <h4 className="vendor-name">{vendor.name}</h4>
            <FitScoreGauge score={vendor.fit_score} />
          </div>
          
          <div className="vendor-badges">
            <span className={`badge position-${positionConfig.color}`}>
              <PositionIcon size={12} />
              {positionConfig.label}
            </span>
            <span className={`badge target-${targetConfig.color}`}>
              <Users size={12} />
              {targetConfig.label}
            </span>
          </div>
          
          <p className="vendor-description">{vendor.description}</p>
        </div>

        <button className="expand-btn" onClick={() => onToggleExpand(index)}>
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {isExpanded && (
        <div className="vendor-details">
          {vendor.website && (
            <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="vendor-website">
              <Globe size={14} />
              {vendor.website}
              <ExternalLink size={12} />
            </a>
          )}

          <div className="detail-section fit-section">
            <label><Star size={14} /> Fit Assessment</label>
            <p>{vendor.fit_rationale}</p>
          </div>

          <div className="detail-columns">
            <div className="detail-section strengths">
              <label><Check size={14} /> Strengths</label>
              <ul>
                {vendor.strengths?.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            
            {vendor.considerations?.length > 0 && (
              <div className="detail-section considerations">
                <label><AlertCircle size={14} /> Considerations</label>
                <ul>
                  {vendor.considerations.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}
          </div>

          <div className="detail-row">
            {vendor.pricing_model && (
              <div className="detail-item">
                <label>Pricing Model</label>
                <span>{vendor.pricing_model}</span>
              </div>
            )}
            {vendor.deployment_options?.length > 0 && (
              <div className="detail-item">
                <label>Deployment</label>
                <span>{vendor.deployment_options.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MarketResearchResults({ isOpen, onClose, researchResults, onAddVendors }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  const [expandedIndices, setExpandedIndices] = useState(new Set());
  const [filterPosition, setFilterPosition] = useState('all');
  const [filterMinFit, setFilterMinFit] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [adding, setAdding] = useState(false);

  const vendors = researchResults?.vendor_recommendations || [];
  const marketOverview = researchResults?.market_overview || {};
  
  const filteredVendors = useMemo(() => {
    let result = vendors;
    
    if (filterPosition !== 'all') {
      result = result.filter(v => v.market_position === filterPosition);
    }
    
    if (filterMinFit > 0) {
      result = result.filter(v => v.fit_score >= filterMinFit);
    }
    
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(v => 
        v.name.toLowerCase().includes(search) ||
        v.description?.toLowerCase().includes(search)
      );
    }
    
    return result;
  }, [vendors, filterPosition, filterMinFit, searchTerm]);

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
    if (selectedIndices.size === filteredVendors.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(filteredVendors.map((_, i) => i)));
    }
  };

  const handleAddSelected = async () => {
    if (selectedIndices.size === 0) return;
    setAdding(true);
    try {
      const selectedVendors = vendors.filter((_, i) => selectedIndices.has(i));
      await onAddVendors(selectedVendors);
      setSelectedIndices(new Set());
      onClose();
    } catch (error) {
      console.error('Failed to add vendors:', error);
    } finally {
      setAdding(false);
    }
  };

  if (!isOpen || !researchResults) return null;

  const marketSizeConfig = MARKET_SIZE_CONFIG[marketOverview.market_size_indicator] || {};
  const nicheCount = (researchResults.statistics?.niche_count || 0) + (researchResults.statistics?.emerging_count || 0);

  return (
    <div className="market-research-overlay">
      <div className="market-research-modal">
        <div className="modal-header">
          <div className="header-title">
            <Sparkles className="ai-icon" />
            <div>
              <h2>Market Research Results</h2>
              <p className="subtitle">AI-powered vendor identification</p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}><X size={24} /></button>
        </div>

        <div className="tab-bar">
          <button className={`tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <BarChart2 size={16} /> Market Overview
          </button>
          <button className={`tab ${activeTab === 'vendors' ? 'active' : ''}`} onClick={() => setActiveTab('vendors')}>
            <Building2 size={16} /> Vendors ({vendors.length})
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'overview' && (
            <div className="overview-content">
              <div className="market-summary">
                <div className="summary-header">
                  <h3>Market Summary</h3>
                  {marketSizeConfig.label && (
                    <span className={`market-size-badge ${marketSizeConfig.color}`}>
                      {marketSizeConfig.label}
                    </span>
                  )}
                </div>
                <p className="summary-text">{marketOverview.summary}</p>
              </div>

              <div className="stats-row">
                <div className="stat-card">
                  <span className="stat-value">{researchResults.statistics?.total_vendors_identified || vendors.length}</span>
                  <span className="stat-label">Vendors Found</span>
                </div>
                <div className="stat-card leader">
                  <span className="stat-value">{researchResults.statistics?.leaders_count || 0}</span>
                  <span className="stat-label">Market Leaders</span>
                </div>
                <div className="stat-card challenger">
                  <span className="stat-value">{researchResults.statistics?.challengers_count || 0}</span>
                  <span className="stat-label">Challengers</span>
                </div>
                <div className="stat-card niche">
                  <span className="stat-value">{nicheCount}</span>
                  <span className="stat-label">Niche/Emerging</span>
                </div>
              </div>

              {marketOverview.key_trends?.length > 0 && (
                <div className="trends-section">
                  <h3><TrendingUp size={18} /> Key Market Trends</h3>
                  <ul className="trends-list">
                    {marketOverview.key_trends.map((trend, i) => (
                      <li key={i}><span className="trend-marker"></span>{trend}</li>
                    ))}
                  </ul>
                </div>
              )}

              {marketOverview.buyer_considerations?.length > 0 && (
                <div className="considerations-section">
                  <h3><AlertCircle size={18} /> Buyer Considerations</h3>
                  <ul className="considerations-list">
                    {marketOverview.buyer_considerations.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {researchResults.evaluation_recommendations?.length > 0 && (
                <div className="recommendations-section">
                  <h3><Lightbulb size={18} /> Evaluation Recommendations</h3>
                  <div className="recommendations-list">
                    {researchResults.evaluation_recommendations.map((rec, i) => (
                      <div key={i} className="recommendation-item">
                        <span className="rec-number">{i + 1}</span>
                        <p>{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {researchResults.additional_research_suggestions?.length > 0 && (
                <div className="research-suggestions">
                  <h4>Additional Research Suggestions</h4>
                  <ul>
                    {researchResults.additional_research_suggestions.map((sug, i) => (
                      <li key={i}>{sug}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'vendors' && (
            <div className="vendors-content">
              <div className="vendors-toolbar">
                <div className="search-box">
                  <Search size={16} />
                  <input 
                    type="text"
                    placeholder="Search vendors..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="filter-group">
                  <Filter size={16} />
                  <select value={filterPosition} onChange={e => setFilterPosition(e.target.value)}>
                    <option value="all">All Positions</option>
                    <option value="leader">Leaders</option>
                    <option value="challenger">Challengers</option>
                    <option value="niche">Niche</option>
                    <option value="emerging">Emerging</option>
                  </select>
                </div>

                <div className="filter-group">
                  <Star size={16} />
                  <select value={filterMinFit} onChange={e => setFilterMinFit(Number(e.target.value))}>
                    <option value="0">Any Fit Score</option>
                    <option value="9">9+ Excellent</option>
                    <option value="7">7+ Good</option>
                    <option value="5">5+ Moderate</option>
                  </select>
                </div>

                <div className="bulk-actions">
                  <button className="btn-text" onClick={handleSelectAll}>
                    {selectedIndices.size === filteredVendors.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span className="selected-count">{selectedIndices.size} selected</span>
                </div>
              </div>

              <div className="vendors-list">
                {filteredVendors.length === 0 ? (
                  <div className="empty-state">
                    <Building2 size={48} />
                    <p>No vendors match the current filters</p>
                  </div>
                ) : (
                  filteredVendors.map((vendor, index) => (
                    <VendorCard
                      key={index}
                      vendor={vendor}
                      index={index}
                      isSelected={selectedIndices.has(index)}
                      isExpanded={expandedIndices.has(index)}
                      onToggleSelect={handleToggleSelect}
                      onToggleExpand={handleToggleExpand}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
          {activeTab === 'vendors' && (
            <button 
              className="btn-primary" 
              onClick={handleAddSelected} 
              disabled={selectedIndices.size === 0 || adding}
            >
              {adding ? 'Adding...' : (
                <>Add {selectedIndices.size} Vendor{selectedIndices.size !== 1 ? 's' : ''} <ArrowRight size={16} /></>
              )}
            </button>
          )}
          {activeTab === 'overview' && vendors.length > 0 && (
            <button className="btn-primary" onClick={() => setActiveTab('vendors')}>
              View Vendors <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

MarketResearchResults.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  researchResults: PropTypes.object,
  onAddVendors: PropTypes.func.isRequired
};

export default MarketResearchResults;
