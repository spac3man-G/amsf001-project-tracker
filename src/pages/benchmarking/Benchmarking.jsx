/**
 * Benchmarking Page - SFIA 8 Rate Comparison Tool
 * 
 * Compares UK IT/digital market rates across 3 tiers:
 * - Contractor: Independent contractors
 * - Associate: Mid-tier consultancies
 * - Top 4: Big 4 consultancies (Deloitte, PwC, EY, KPMG)
 * 
 * Access: Admin and Supplier PM only
 * 
 * @version 2.0 - Database-backed via benchmarkRatesService
 * @created 26 December 2025
 * @checkpoint 1 - Linked Estimates Feature
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
  AlertCircle
} from 'lucide-react';
import './Benchmarking.css';

// Import from centralized service
import {
  benchmarkRatesService,
  ROLE_FAMILIES,
  ROLES,
  SKILLS,
  SFIA_LEVELS,
  getRoleName,
  getSkillName,
  getFamilyName,
  getRoleFamily,
  formatRate,
  calculatePremium
} from '../../services';

// =============================================================================
// FALLBACK STATIC DATA (used if database is empty)
// =============================================================================

const FALLBACK_BENCHMARK_RATES = [
  // Software Engineering
  { roleId: 'DEV', skillId: 'JAVA', level: 3, contractor: 525, associate: 750, top4: 1100 },
  { roleId: 'DEV', skillId: 'JAVA', level: 4, contractor: 600, associate: 850, top4: 1250 },
  { roleId: 'DEV', skillId: 'PYTHON', level: 3, contractor: 500, associate: 720, top4: 1050 },
  { roleId: 'DEV', skillId: 'PYTHON', level: 4, contractor: 575, associate: 820, top4: 1200 },
  { roleId: 'SDEV', skillId: 'JAVA', level: 4, contractor: 650, associate: 920, top4: 1350 },
  { roleId: 'SDEV', skillId: 'JAVA', level: 5, contractor: 750, associate: 1050, top4: 1550 },
  { roleId: 'ARCH', skillId: 'AWS', level: 5, contractor: 850, associate: 1200, top4: 1800 },
  { roleId: 'ARCH', skillId: 'AWS', level: 6, contractor: 950, associate: 1400, top4: 2100 },
  // Data & Analytics
  { roleId: 'DATASCI', skillId: 'PYTHON', level: 4, contractor: 600, associate: 850, top4: 1300 },
  { roleId: 'DATASCI', skillId: 'ML', level: 5, contractor: 775, associate: 1100, top4: 1650 },
  // DevOps & Cloud
  { roleId: 'DEVOPS', skillId: 'K8S', level: 4, contractor: 600, associate: 850, top4: 1280 },
  { roleId: 'DEVOPS', skillId: 'AWS', level: 5, contractor: 675, associate: 950, top4: 1420 },
  // Security
  { roleId: 'SECENG', skillId: 'AWS', level: 4, contractor: 625, associate: 880, top4: 1320 },
  { roleId: 'SECARCH', skillId: 'AWS', level: 5, contractor: 800, associate: 1140, top4: 1720 },
  // Project Management
  { roleId: 'PM', skillId: 'AGILE', level: 4, contractor: 550, associate: 780, top4: 1180 },
  { roleId: 'SPM', skillId: 'AGILE', level: 5, contractor: 700, associate: 1000, top4: 1500 },
  // Business Analysis
  { roleId: 'BA', skillId: 'AGILE', level: 3, contractor: 450, associate: 640, top4: 960 },
  { roleId: 'BA', skillId: 'AGILE', level: 4, contractor: 525, associate: 750, top4: 1120 }
];

// =============================================================================
// COMPONENT
// =============================================================================

export default function Benchmarking() {
  // Data state
  const [benchmarkRates, setBenchmarkRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState('loading'); // 'database', 'fallback', 'loading'
  
  // Filter state
  const [filters, setFilters] = useState({
    familyId: '',
    roleId: '',
    skillId: '',
    levelMin: '',
    levelMax: '',
    searchTerm: ''
  });
  
  const [sortConfig, setSortConfig] = useState({ key: 'roleId', direction: 'asc' });
  const [showFilters, setShowFilters] = useState(true);

  // Load benchmark rates from database on mount
  useEffect(() => {
    async function loadRates() {
      try {
        setLoading(true);
        setError(null);
        
        const rates = await benchmarkRatesService.getAllRates();
        
        if (rates && rates.length > 0) {
          // Transform database format to component format
          const transformedRates = rates.map(r => ({
            roleId: r.role_id,
            skillId: r.skill_id,
            level: r.sfia_level,
            contractor: Number(r.contractor_rate) || 0,
            associate: Number(r.associate_rate) || 0,
            top4: Number(r.top4_rate) || 0
          }));
          setBenchmarkRates(transformedRates);
          setDataSource('database');
        } else {
          // No data in database, use fallback
          console.warn('No benchmark rates in database, using fallback data');
          setBenchmarkRates(FALLBACK_BENCHMARK_RATES);
          setDataSource('fallback');
        }
      } catch (err) {
        console.error('Failed to load benchmark rates:', err);
        setError(err.message);
        // Use fallback data on error
        setBenchmarkRates(FALLBACK_BENCHMARK_RATES);
        setDataSource('fallback');
      } finally {
        setLoading(false);
      }
    }
    
    loadRates();
  }, []);

  // Filter options based on current selections
  const availableRoles = useMemo(() => {
    if (!filters.familyId) return ROLES;
    return ROLES.filter(r => r.familyId === filters.familyId);
  }, [filters.familyId]);


  // Filter and sort benchmark data
  const filteredData = useMemo(() => {
    let data = [...benchmarkRates];
    
    // Apply filters
    if (filters.familyId) {
      data = data.filter(d => getRoleFamily(d.roleId) === filters.familyId);
    }
    if (filters.roleId) {
      data = data.filter(d => d.roleId === filters.roleId);
    }
    if (filters.skillId) {
      data = data.filter(d => d.skillId === filters.skillId);
    }
    if (filters.levelMin) {
      data = data.filter(d => d.level >= parseInt(filters.levelMin));
    }
    if (filters.levelMax) {
      data = data.filter(d => d.level <= parseInt(filters.levelMax));
    }
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      data = data.filter(d => 
        getRoleName(d.roleId).toLowerCase().includes(term) ||
        getSkillName(d.skillId).toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    data.sort((a, b) => {
      let aVal, bVal;
      switch (sortConfig.key) {
        case 'roleId':
          aVal = getRoleName(a.roleId);
          bVal = getRoleName(b.roleId);
          break;
        case 'skillId':
          aVal = getSkillName(a.skillId);
          bVal = getSkillName(b.skillId);
          break;
        case 'level':
          aVal = a.level;
          bVal = b.level;
          break;
        case 'contractor':
        case 'associate':
        case 'top4':
          aVal = a[sortConfig.key];
          bVal = b[sortConfig.key];
          break;
        default:
          return 0;
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return data;
  }, [benchmarkRates, filters, sortConfig]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (filteredData.length === 0) return null;
    
    const avgContractor = Math.round(
      filteredData.reduce((sum, d) => sum + d.contractor, 0) / filteredData.length
    );
    const avgAssociate = Math.round(
      filteredData.reduce((sum, d) => sum + d.associate, 0) / filteredData.length
    );
    const avgTop4 = Math.round(
      filteredData.reduce((sum, d) => sum + d.top4, 0) / filteredData.length
    );
    
    return {
      avgContractor,
      avgAssociate,
      avgTop4,
      associatePremium: calculatePremium(avgContractor, avgAssociate),
      top4Premium: calculatePremium(avgContractor, avgTop4),
      count: filteredData.length
    };
  }, [filteredData]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const clearFilters = () => {
    setFilters({
      familyId: '',
      roleId: '',
      skillId: '',
      levelMin: '',
      levelMax: '',
      searchTerm: ''
    });
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp size={14} /> 
      : <ChevronDown size={14} />;
  };

  // Loading state
  if (loading) {
    return (
      <div className="benchmarking-page" data-testid="benchmarking-page">
        <div className="bench-loading">
          <Loader2 size={48} className="bench-spinner" />
          <p>Loading benchmark rates...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="benchmarking-page" data-testid="benchmarking-page">
      {/* Header */}
      <header className="bench-header" data-testid="benchmarking-header">
        <div className="bench-header-content">
          <div className="bench-header-left">
            <div className="bench-header-icon">
              <Scale size={24} />
            </div>
            <div>
              <h1>Rate Benchmarking</h1>
              <p>SFIA 8 UK Market Rate Comparison</p>
            </div>
          </div>
          <div className="bench-header-actions">
            <button 
              className="bench-btn bench-btn-secondary"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={18} />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            <button 
              className="bench-btn bench-btn-primary"
              onClick={() => alert('AI Rate Research feature coming soon!\n\nThis will search ITJobsWatch and other sources to update benchmark rates.')}
            >
              <Bot size={18} />
              Research Rates
            </button>
          </div>
        </div>
      </header>

      <div className="bench-content">
        {/* Data Source Warning */}
        {dataSource === 'fallback' && (
          <div className="bench-warning">
            <AlertCircle size={18} />
            <span>
              Using sample data. Run the database migration to load full benchmark rates.
              {error && ` (Error: ${error})`}
            </span>
          </div>
        )}

        {/* Filter Panel */}
        {showFilters && (
          <div className="bench-filters" data-testid="benchmarking-filters">
            <div className="bench-filters-grid">
              {/* Search */}
              <div className="bench-filter-group bench-filter-search">
                <label>Search</label>
                <div className="bench-search-input">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search roles or skills..."
                    value={filters.searchTerm}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  />
                </div>
              </div>
              
              {/* Role Family */}
              <div className="bench-filter-group">
                <label>Role Family</label>
                <select
                  value={filters.familyId}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    familyId: e.target.value,
                    roleId: '' // Reset role when family changes
                  }))}
                >
                  <option value="">All Families</option>
                  {ROLE_FAMILIES.map(f => (
                    <option key={f.id} value={f.id}>{f.icon} {f.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Role */}
              <div className="bench-filter-group">
                <label>Role</label>
                <select
                  value={filters.roleId}
                  onChange={(e) => setFilters(prev => ({ ...prev, roleId: e.target.value }))}
                >
                  <option value="">All Roles</option>
                  {availableRoles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Skill */}
              <div className="bench-filter-group">
                <label>Skill</label>
                <select
                  value={filters.skillId}
                  onChange={(e) => setFilters(prev => ({ ...prev, skillId: e.target.value }))}
                >
                  <option value="">All Skills</option>
                  {SKILLS.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              
              {/* SFIA Level Range */}
              <div className="bench-filter-group bench-filter-level">
                <label>SFIA Level</label>
                <div className="bench-level-range">
                  <select
                    value={filters.levelMin}
                    onChange={(e) => setFilters(prev => ({ ...prev, levelMin: e.target.value }))}
                  >
                    <option value="">Min</option>
                    {SFIA_LEVELS.map(l => (
                      <option key={l.id} value={l.id}>L{l.id}</option>
                    ))}
                  </select>
                  <span>to</span>
                  <select
                    value={filters.levelMax}
                    onChange={(e) => setFilters(prev => ({ ...prev, levelMax: e.target.value }))}
                  >
                    <option value="">Max</option>
                    {SFIA_LEVELS.map(l => (
                      <option key={l.id} value={l.id}>L{l.id}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Clear Filters */}
              <div className="bench-filter-group bench-filter-clear">
                <button 
                  className="bench-btn bench-btn-text"
                  onClick={clearFilters}
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}


        {/* Statistics Panel */}
        {stats && (
          <div className="bench-stats" data-testid="benchmarking-stats">
            <div className="bench-stat-card">
              <div className="bench-stat-icon contractor">
                <Users size={20} />
              </div>
              <div className="bench-stat-content">
                <span className="bench-stat-label">Avg Contractor</span>
                <span className="bench-stat-value">{formatRate(stats.avgContractor)}</span>
                <span className="bench-stat-sub">per day</span>
              </div>
            </div>
            
            <div className="bench-stat-card">
              <div className="bench-stat-icon associate">
                <Building2 size={20} />
              </div>
              <div className="bench-stat-content">
                <span className="bench-stat-label">Avg Associate</span>
                <span className="bench-stat-value">{formatRate(stats.avgAssociate)}</span>
                <span className="bench-stat-premium">+{stats.associatePremium}% vs contractor</span>
              </div>
            </div>
            
            <div className="bench-stat-card">
              <div className="bench-stat-icon top4">
                <Award size={20} />
              </div>
              <div className="bench-stat-content">
                <span className="bench-stat-label">Avg Top 4</span>
                <span className="bench-stat-value">{formatRate(stats.avgTop4)}</span>
                <span className="bench-stat-premium">+{stats.top4Premium}% vs contractor</span>
              </div>
            </div>
            
            <div className="bench-stat-card bench-stat-count">
              <div className="bench-stat-content">
                <span className="bench-stat-label">Showing</span>
                <span className="bench-stat-value">{stats.count}</span>
                <span className="bench-stat-sub">benchmark{stats.count !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>
        )}

        {/* Results Table */}
        <div className="bench-table-card" data-testid="benchmarking-table">
          <div className="bench-table-header">
            <h2>Benchmark Rates</h2>
            <div className="bench-table-info">
              <Info size={14} />
              <span>
                Daily rates in GBP • 
                {dataSource === 'database' 
                  ? ' Source: Database (ITJobsWatch, G-Cloud Dec 2025)' 
                  : ' Source: Sample data'}
              </span>
            </div>
          </div>
          
          {filteredData.length === 0 ? (
            <div className="bench-empty">
              <Scale size={48} />
              <h3>No benchmarks found</h3>
              <p>Try adjusting your filters to see more results.</p>
              <button className="bench-btn bench-btn-primary" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="bench-table-wrapper">
              <table className="bench-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort('roleId')} className="sortable">
                      Role <SortIcon column="roleId" />
                    </th>
                    <th onClick={() => handleSort('skillId')} className="sortable">
                      Skill <SortIcon column="skillId" />
                    </th>
                    <th onClick={() => handleSort('level')} className="sortable">
                      SFIA <SortIcon column="level" />
                    </th>
                    <th onClick={() => handleSort('contractor')} className="sortable rate-col">
                      Contractor <SortIcon column="contractor" />
                    </th>
                    <th onClick={() => handleSort('associate')} className="sortable rate-col">
                      Associate <SortIcon column="associate" />
                    </th>
                    <th onClick={() => handleSort('top4')} className="sortable rate-col">
                      Top 4 <SortIcon column="top4" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, idx) => (
                    <tr key={`${row.roleId}-${row.skillId}-${row.level}-${idx}`}>
                      <td>
                        <div className="bench-role-cell">
                          <span className="bench-role-name">{getRoleName(row.roleId)}</span>
                          <span className="bench-role-family">{getFamilyName(getRoleFamily(row.roleId))}</span>
                        </div>
                      </td>
                      <td>
                        <span className="bench-skill-badge">{getSkillName(row.skillId)}</span>
                      </td>
                      <td>
                        <span className={`bench-level-badge level-${row.level}`}>
                          L{row.level}
                        </span>
                      </td>
                      <td className="rate-cell contractor">{formatRate(row.contractor)}</td>
                      <td className="rate-cell associate">
                        {formatRate(row.associate)}
                        <span className="rate-premium">+{calculatePremium(row.contractor, row.associate)}%</span>
                      </td>
                      <td className="rate-cell top4">
                        {formatRate(row.top4)}
                        <span className="rate-premium">+{calculatePremium(row.contractor, row.top4)}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>


        {/* Info Footer */}
        <div className="bench-footer">
          <div className="bench-footer-info">
            <Info size={16} />
            <div>
              <strong>About this data:</strong> Rates are based on UK market research from ITJobsWatch 
              (contractor rates) and G-Cloud government framework (consultancy rates) as of December 2025. 
              Contractor rates represent median daily rates for independent contractors. Associate rates 
              represent mid-tier consultancies. Top 4 rates represent Big 4 consultancy firms 
              (Deloitte, PwC, EY, KPMG).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
