/**
 * Benchmarking Page - SFIA 8 Rate Comparison Tool
 * 
 * Compares UK IT/digital market rates across 4 tiers:
 * - Contractor: Independent contractors
 * - Boutique: Specialist smaller consultancies
 * - Mid-tier: Mid-sized consultancies (Capgemini, CGI, etc.)
 * - Big 4: Global SIs (Deloitte, PwC, EY, KPMG, Accenture)
 * 
 * Full SFIA 8 framework with 97 professional skills
 * 
 * Access: Admin and Supplier PM only
 * 
 * @version 3.0 - Full SFIA 8 support
 * @created 27 December 2025
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Scale, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Search,
  Bot,
  Info,
  ChevronDown,
  ChevronUp,
  Building2,
  Users,
  Award,
  Loader2,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import './Benchmarking.css';

// Import SFIA 8 reference data and service
import {
  benchmarkRatesService,
  SFIA_CATEGORIES,
  SFIA_SUBCATEGORIES,
  SFIA_SKILLS,
  SFIA_LEVELS,
  TIERS,
  getSkillName,
  getSkillCode,
  getCategoryName,
  getCategoryColor,
  getSubcategoryName,
  getTierName,
  getTierColor,
  getLevelTitle,
  formatRate,
  calculatePremium,
  calculateDefaultRate
} from '../../services';

// =============================================================================
// COMPONENT
// =============================================================================

export default function Benchmarking() {
  // Data state
  const [benchmarkRates, setBenchmarkRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState('loading');
  const [stats, setStats] = useState(null);
  
  // Filter state
  const [filters, setFilters] = useState({
    categoryId: '',
    subcategoryId: '',
    skillId: '',
    levelMin: '',
    levelMax: '',
    tierId: '',
    searchTerm: ''
  });
  
  // UI state
  const [expandedCategories, setExpandedCategories] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadBenchmarkData();
  }, []);

  const loadBenchmarkData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [rates, summaryStats] = await Promise.all([
        benchmarkRatesService.getAllRates(),
        benchmarkRatesService.getSummaryStats()
      ]);
      
      if (rates && rates.length > 0) {
        setBenchmarkRates(rates);
        setDataSource('database');
      } else {
        // Generate default rates if database is empty
        const defaultRates = generateDefaultRates();
        setBenchmarkRates(defaultRates);
        setDataSource('generated');
      }
      
      setStats(summaryStats);
    } catch (err) {
      console.error('Error loading benchmark data:', err);
      setError(err.message);
      // Use generated rates as fallback
      const defaultRates = generateDefaultRates();
      setBenchmarkRates(defaultRates);
      setDataSource('fallback');
    } finally {
      setLoading(false);
    }
  };

  // Generate default rates from SFIA reference data
  const generateDefaultRates = () => {
    const rates = [];
    for (const skill of SFIA_SKILLS) {
      for (const level of skill.levels) {
        for (const tier of TIERS) {
          rates.push({
            skill_id: skill.id,
            skill_name: skill.name,
            skill_code: skill.code,
            subcategory_id: skill.subcategoryId,
            category_id: SFIA_SUBCATEGORIES.find(sc => sc.id === skill.subcategoryId)?.categoryId || 'SA',
            sfia_level: level,
            tier_id: tier.id,
            tier_name: tier.name,
            day_rate: calculateDefaultRate(skill.id, level, tier.id),
            source: 'Generated default'
          });
        }
      }
    }
    return rates;
  };

  // Get filtered subcategories based on selected category
  const filteredSubcategories = useMemo(() => {
    if (!filters.categoryId) return SFIA_SUBCATEGORIES;
    return SFIA_SUBCATEGORIES.filter(sc => sc.categoryId === filters.categoryId);
  }, [filters.categoryId]);

  // Get filtered skills based on selected subcategory
  const filteredSkillOptions = useMemo(() => {
    if (filters.subcategoryId) {
      return SFIA_SKILLS.filter(s => s.subcategoryId === filters.subcategoryId);
    }
    if (filters.categoryId) {
      const subcatIds = SFIA_SUBCATEGORIES
        .filter(sc => sc.categoryId === filters.categoryId)
        .map(sc => sc.id);
      return SFIA_SKILLS.filter(s => subcatIds.includes(s.subcategoryId));
    }
    return SFIA_SKILLS;
  }, [filters.categoryId, filters.subcategoryId]);

  // Filter and group rates
  const groupedRates = useMemo(() => {
    let filtered = benchmarkRates;

    // Apply filters
    if (filters.categoryId) {
      filtered = filtered.filter(r => r.category_id === filters.categoryId);
    }
    if (filters.subcategoryId) {
      filtered = filtered.filter(r => r.subcategory_id === filters.subcategoryId);
    }
    if (filters.skillId) {
      filtered = filtered.filter(r => r.skill_id === filters.skillId);
    }
    if (filters.tierId) {
      filtered = filtered.filter(r => r.tier_id === filters.tierId);
    }
    if (filters.levelMin) {
      filtered = filtered.filter(r => r.sfia_level >= parseInt(filters.levelMin));
    }
    if (filters.levelMax) {
      filtered = filtered.filter(r => r.sfia_level <= parseInt(filters.levelMax));
    }
    if (filters.searchTerm) {
      const search = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.skill_name.toLowerCase().includes(search) ||
        r.skill_code?.toLowerCase().includes(search) ||
        r.skill_id.toLowerCase().includes(search)
      );
    }

    // Group by category > subcategory > skill > level
    const grouped = {};
    for (const rate of filtered) {
      const catId = rate.category_id;
      const subcatId = rate.subcategory_id;
      const skillId = rate.skill_id;
      const level = rate.sfia_level;

      if (!grouped[catId]) {
        grouped[catId] = {
          id: catId,
          name: getCategoryName(catId),
          color: getCategoryColor(catId),
          subcategories: {}
        };
      }

      if (!grouped[catId].subcategories[subcatId]) {
        grouped[catId].subcategories[subcatId] = {
          id: subcatId,
          name: getSubcategoryName(subcatId),
          skills: {}
        };
      }

      if (!grouped[catId].subcategories[subcatId].skills[skillId]) {
        grouped[catId].subcategories[subcatId].skills[skillId] = {
          id: skillId,
          name: rate.skill_name,
          code: rate.skill_code,
          levels: {}
        };
      }

      if (!grouped[catId].subcategories[subcatId].skills[skillId].levels[level]) {
        grouped[catId].subcategories[subcatId].skills[skillId].levels[level] = {
          level,
          title: getLevelTitle(level),
          tiers: {}
        };
      }

      grouped[catId].subcategories[subcatId].skills[skillId].levels[level].tiers[rate.tier_id] = {
        tierId: rate.tier_id,
        tierName: rate.tier_name,
        dayRate: parseFloat(rate.day_rate)
      };
    }

    return grouped;
  }, [benchmarkRates, filters]);

  // Toggle category expansion
  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Render tier comparison for a skill/level
  const renderTierComparison = (levelData) => {
    const tiers = levelData.tiers;
    const contractorRate = tiers.contractor?.dayRate;
    
    return (
      <>
        {TIERS.map(tier => {
          const tierData = tiers[tier.id];
          const premium = tier.id !== 'contractor' && contractorRate && tierData
            ? calculatePremium(contractorRate, tierData.dayRate)
            : null;
          
          return (
            <td key={tier.id} className="rate-cell">
              {tierData ? (
                <>
                  <span className="rate-value">{formatRate(tierData.dayRate)}</span>
                  {premium !== null && (
                    <span className="rate-premium">+{premium}%</span>
                  )}
                </>
              ) : (
                <span className="rate-na">—</span>
              )}
            </td>
          );
        })}
      </>
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      categoryId: '',
      subcategoryId: '',
      skillId: '',
      levelMin: '',
      levelMax: '',
      tierId: '',
      searchTerm: ''
    });
  };

  if (loading) {
    return (
      <div className="benchmarking-page">
        <div className="loading-state">
          <Loader2 className="spinner" size={48} />
          <p>Loading SFIA 8 benchmark rates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="benchmarking-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <Scale size={32} />
          <div>
            <h1>SFIA 8 Benchmark Rates</h1>
            <p>UK IT/Digital market day rates by skill, level, and supplier tier</p>
          </div>
        </div>
        <div className="header-stats">
          <div className="stat">
            <span className="stat-value">{stats?.skillsCovered || SFIA_SKILLS.length}</span>
            <span className="stat-label">Skills</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats?.totalRates || benchmarkRates.length}</span>
            <span className="stat-label">Rates</span>
          </div>
          <div className="stat">
            <span className="stat-value">{TIERS.length}</span>
            <span className="stat-label">Tiers</span>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Data Source Info */}
      {dataSource !== 'database' && (
        <div className="info-banner">
          <Info size={20} />
          <span>
            {dataSource === 'generated' 
              ? 'Showing calculated default rates. Save rates to persist them.'
              : 'Using fallback data due to database error.'}
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-header">
          <button 
            className="filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} />
            <span>Filters</span>
            {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search skills..."
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
            />
          </div>
        </div>

        {showFilters && (
          <div className="filters-panel">
            <div className="filter-row">
              <div className="filter-group">
                <label>Category</label>
                <select
                  value={filters.categoryId}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    categoryId: e.target.value,
                    subcategoryId: '',
                    skillId: ''
                  }))}
                >
                  <option value="">All Categories</option>
                  {SFIA_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Subcategory</label>
                <select
                  value={filters.subcategoryId}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    subcategoryId: e.target.value,
                    skillId: ''
                  }))}
                >
                  <option value="">All Subcategories</option>
                  {filteredSubcategories.map(sc => (
                    <option key={sc.id} value={sc.id}>{sc.name}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Skill</label>
                <select
                  value={filters.skillId}
                  onChange={(e) => setFilters(prev => ({ ...prev, skillId: e.target.value }))}
                >
                  <option value="">All Skills</option>
                  {filteredSkillOptions.map(skill => (
                    <option key={skill.id} value={skill.id}>
                      {skill.code} - {skill.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="filter-row">
              <div className="filter-group">
                <label>Tier</label>
                <select
                  value={filters.tierId}
                  onChange={(e) => setFilters(prev => ({ ...prev, tierId: e.target.value }))}
                >
                  <option value="">All Tiers</option>
                  {TIERS.map(tier => (
                    <option key={tier.id} value={tier.id}>{tier.name}</option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Min Level</label>
                <select
                  value={filters.levelMin}
                  onChange={(e) => setFilters(prev => ({ ...prev, levelMin: e.target.value }))}
                >
                  <option value="">Any</option>
                  {SFIA_LEVELS.map(level => (
                    <option key={level.id} value={level.id}>
                      Level {level.id} - {level.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Max Level</label>
                <select
                  value={filters.levelMax}
                  onChange={(e) => setFilters(prev => ({ ...prev, levelMax: e.target.value }))}
                >
                  <option value="">Any</option>
                  {SFIA_LEVELS.map(level => (
                    <option key={level.id} value={level.id}>
                      Level {level.id} - {level.title}
                    </option>
                  ))}
                </select>
              </div>

              <button className="clear-filters" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tier Legend */}
      <div className="tier-legend">
        {TIERS.map(tier => (
          <div key={tier.id} className="legend-item">
            <div className="legend-color" style={{ backgroundColor: tier.color }} />
            <span className="legend-name">{tier.name}</span>
            <span className="legend-desc">{tier.description}</span>
          </div>
        ))}
      </div>

      {/* Rate Cards by Category */}
      <div className="rates-container">
        {Object.entries(groupedRates).map(([catId, category]) => (
          <div key={catId} className="category-section">
            <div 
              className="category-header"
              onClick={() => toggleCategory(catId)}
              style={{ borderLeftColor: category.color }}
            >
              <div className="category-title">
                <Briefcase size={20} style={{ color: category.color }} />
                <h2>{category.name}</h2>
              </div>
              <div className="category-toggle">
                {expandedCategories[catId] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </div>

            {expandedCategories[catId] && (
              <div className="category-content">
                {Object.entries(category.subcategories).map(([subcatId, subcategory]) => (
                  <div key={subcatId} className="subcategory-section">
                    <h3 className="subcategory-title">{subcategory.name}</h3>
                    
                    <div className="skills-list">
                      {Object.entries(subcategory.skills).map(([skillId, skill]) => (
                        <div key={skillId} className="skill-table-wrapper">
                          <div className="skill-table-header">
                            <span className="skill-code">{skill.code}</span>
                            <span className="skill-name">{skill.name}</span>
                          </div>
                          
                          <table className="rates-table">
                            <thead>
                              <tr>
                                <th className="level-col">Level</th>
                                {TIERS.map(tier => (
                                  <th key={tier.id} className="tier-col">
                                    <span className="tier-dot" style={{ backgroundColor: tier.color }} />
                                    {tier.id === 'contractor' ? 'Contractor' : 
                                     tier.id === 'boutique' ? 'Boutique' :
                                     tier.id === 'mid' ? 'Mid-tier' : 'Big 4'}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(skill.levels)
                                .sort(([a], [b]) => parseInt(a) - parseInt(b))
                                .map(([level, levelData]) => (
                                  <tr key={level}>
                                    <td className="level-cell">
                                      <span className="level-num">L{level}</span>
                                      <span className="level-name">{levelData.title}</span>
                                    </td>
                                    {renderTierComparison(levelData)}
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {Object.keys(groupedRates).length === 0 && (
        <div className="empty-state">
          <Scale size={48} />
          <h3>No rates found</h3>
          <p>Try adjusting your filters or search term</p>
          <button onClick={clearFilters}>Clear Filters</button>
        </div>
      )}
    </div>
  );
}
