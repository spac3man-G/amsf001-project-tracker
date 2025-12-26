/**
 * Benchmarking Page - SFIA 8 Rate Comparison Tool
 * 
 * Static MVP implementation for UI validation.
 * Compares UK IT/digital market rates across 3 tiers:
 * - Contractor: Independent contractors
 * - Associate: Mid-tier consultancies
 * - Top 4: Big 4 consultancies (Deloitte, PwC, EY, KPMG)
 * 
 * Access: Admin and Supplier PM only
 * 
 * @version 1.0 - Static MVP
 * @created 26 December 2025
 */

import React, { useState, useMemo } from 'react';
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
  Award
} from 'lucide-react';
import './Benchmarking.css';

// =============================================================================
// STATIC BENCHMARK DATA - MVP
// Based on UK market research, December 2025
// =============================================================================

const ROLE_FAMILIES = [
  { id: 'SE', name: 'Software Engineering', icon: '💻' },
  { id: 'DA', name: 'Data & Analytics', icon: '📊' },
  { id: 'DEVOPS', name: 'DevOps & Cloud', icon: '☁️' },
  { id: 'BA', name: 'Business Analysis', icon: '📋' },
  { id: 'SEC', name: 'Security', icon: '🔒' },
  { id: 'PM', name: 'Project Management', icon: '📁' }
];

const ROLES = [
  { id: 'DEV', name: 'Software Developer', familyId: 'SE' },
  { id: 'SDEV', name: 'Senior Developer', familyId: 'SE' },
  { id: 'LDEV', name: 'Lead Developer', familyId: 'SE' },
  { id: 'ARCH', name: 'Solutions Architect', familyId: 'SE' },
  { id: 'DATASCI', name: 'Data Scientist', familyId: 'DA' },
  { id: 'DATAENG', name: 'Data Engineer', familyId: 'DA' },
  { id: 'ANALYST', name: 'Data Analyst', familyId: 'DA' },
  { id: 'MLENG', name: 'ML Engineer', familyId: 'DA' },
  { id: 'DEVOPS', name: 'DevOps Engineer', familyId: 'DEVOPS' },
  { id: 'SRE', name: 'Site Reliability Engineer', familyId: 'DEVOPS' },
  { id: 'CLOUD', name: 'Cloud Engineer', familyId: 'DEVOPS' },
  { id: 'PLAT', name: 'Platform Engineer', familyId: 'DEVOPS' },
  { id: 'BA', name: 'Business Analyst', familyId: 'BA' },
  { id: 'SBA', name: 'Senior Business Analyst', familyId: 'BA' },
  { id: 'PO', name: 'Product Owner', familyId: 'BA' },
  { id: 'SECENG', name: 'Security Engineer', familyId: 'SEC' },
  { id: 'SECARCH', name: 'Security Architect', familyId: 'SEC' },
  { id: 'PENT', name: 'Penetration Tester', familyId: 'SEC' },
  { id: 'PM', name: 'Project Manager', familyId: 'PM' },
  { id: 'SPM', name: 'Senior Project Manager', familyId: 'PM' },
  { id: 'DELM', name: 'Delivery Manager', familyId: 'PM' },
  { id: 'PROG', name: 'Programme Manager', familyId: 'PM' }
];

const SKILLS = [
  { id: 'JAVA', name: 'Java', category: 'Languages' },
  { id: 'PYTHON', name: 'Python', category: 'Languages' },
  { id: 'DOTNET', name: '.NET/C#', category: 'Languages' },
  { id: 'JS', name: 'JavaScript/TypeScript', category: 'Languages' },
  { id: 'GO', name: 'Go', category: 'Languages' },
  { id: 'AWS', name: 'AWS', category: 'Cloud' },
  { id: 'AZURE', name: 'Azure', category: 'Cloud' },
  { id: 'GCP', name: 'GCP', category: 'Cloud' },
  { id: 'K8S', name: 'Kubernetes', category: 'DevOps' },
  { id: 'DOCKER', name: 'Docker', category: 'DevOps' },
  { id: 'TERRAFORM', name: 'Terraform', category: 'DevOps' },
  { id: 'ML', name: 'Machine Learning', category: 'Data' },
  { id: 'SQL', name: 'SQL/Databases', category: 'Data' },
  { id: 'SPARK', name: 'Spark/Big Data', category: 'Data' },
  { id: 'AGILE', name: 'Agile/Scrum', category: 'Methods' }
];

const SFIA_LEVELS = [
  { id: 1, name: 'Level 1', description: 'Follow' },
  { id: 2, name: 'Level 2', description: 'Assist' },
  { id: 3, name: 'Level 3', description: 'Apply' },
  { id: 4, name: 'Level 4', description: 'Enable' },
  { id: 5, name: 'Level 5', description: 'Ensure/Advise' },
  { id: 6, name: 'Level 6', description: 'Initiate/Influence' },
  { id: 7, name: 'Level 7', description: 'Set Strategy' }
];

// Benchmark rates: Daily rates in GBP
// Source: ITJobsWatch, G-Cloud, market research Dec 2025
const BENCHMARK_RATES = [
  // Software Engineering
  { roleId: 'DEV', skillId: 'JAVA', level: 3, contractor: 525, associate: 750, top4: 1100 },
  { roleId: 'DEV', skillId: 'JAVA', level: 4, contractor: 600, associate: 850, top4: 1250 },
  { roleId: 'DEV', skillId: 'PYTHON', level: 3, contractor: 500, associate: 720, top4: 1050 },
  { roleId: 'DEV', skillId: 'PYTHON', level: 4, contractor: 575, associate: 820, top4: 1200 },
  { roleId: 'DEV', skillId: 'DOTNET', level: 3, contractor: 500, associate: 700, top4: 1000 },
  { roleId: 'DEV', skillId: 'DOTNET', level: 4, contractor: 575, associate: 800, top4: 1150 },
  { roleId: 'DEV', skillId: 'JS', level: 3, contractor: 475, associate: 680, top4: 980 },
  { roleId: 'DEV', skillId: 'JS', level: 4, contractor: 550, associate: 780, top4: 1120 },
  { roleId: 'SDEV', skillId: 'JAVA', level: 4, contractor: 650, associate: 920, top4: 1350 },
  { roleId: 'SDEV', skillId: 'JAVA', level: 5, contractor: 750, associate: 1050, top4: 1550 },
  { roleId: 'SDEV', skillId: 'PYTHON', level: 4, contractor: 625, associate: 880, top4: 1300 },
  { roleId: 'SDEV', skillId: 'PYTHON', level: 5, contractor: 725, associate: 1000, top4: 1480 },
  { roleId: 'LDEV', skillId: 'JAVA', level: 5, contractor: 800, associate: 1150, top4: 1700 },
  { roleId: 'LDEV', skillId: 'JAVA', level: 6, contractor: 900, associate: 1300, top4: 1950 },
  { roleId: 'ARCH', skillId: 'AWS', level: 5, contractor: 850, associate: 1200, top4: 1800 },
  { roleId: 'ARCH', skillId: 'AWS', level: 6, contractor: 950, associate: 1400, top4: 2100 },
  { roleId: 'ARCH', skillId: 'AZURE', level: 5, contractor: 825, associate: 1150, top4: 1750 },
  { roleId: 'ARCH', skillId: 'AZURE', level: 6, contractor: 925, associate: 1350, top4: 2050 },
  
  // Data & Analytics
  { roleId: 'DATASCI', skillId: 'PYTHON', level: 4, contractor: 600, associate: 850, top4: 1300 },
  { roleId: 'DATASCI', skillId: 'PYTHON', level: 5, contractor: 700, associate: 1000, top4: 1500 },
  { roleId: 'DATASCI', skillId: 'ML', level: 4, contractor: 650, associate: 920, top4: 1400 },
  { roleId: 'DATASCI', skillId: 'ML', level: 5, contractor: 775, associate: 1100, top4: 1650 },
  { roleId: 'DATAENG', skillId: 'SPARK', level: 4, contractor: 575, associate: 820, top4: 1220 },
  { roleId: 'DATAENG', skillId: 'SPARK', level: 5, contractor: 675, associate: 950, top4: 1420 },
  { roleId: 'DATAENG', skillId: 'SQL', level: 4, contractor: 525, associate: 750, top4: 1100 },
  { roleId: 'MLENG', skillId: 'ML', level: 4, contractor: 700, associate: 1000, top4: 1500 },
  { roleId: 'MLENG', skillId: 'ML', level: 5, contractor: 825, associate: 1180, top4: 1750 },
  
  // DevOps & Cloud
  { roleId: 'DEVOPS', skillId: 'K8S', level: 4, contractor: 600, associate: 850, top4: 1280 },
  { roleId: 'DEVOPS', skillId: 'K8S', level: 5, contractor: 700, associate: 1000, top4: 1500 },
  { roleId: 'DEVOPS', skillId: 'AWS', level: 4, contractor: 575, associate: 820, top4: 1220 },
  { roleId: 'DEVOPS', skillId: 'AWS', level: 5, contractor: 675, associate: 950, top4: 1420 },
  { roleId: 'DEVOPS', skillId: 'TERRAFORM', level: 4, contractor: 550, associate: 780, top4: 1160 },
  { roleId: 'SRE', skillId: 'K8S', level: 5, contractor: 725, associate: 1030, top4: 1550 },
  { roleId: 'CLOUD', skillId: 'AWS', level: 4, contractor: 600, associate: 850, top4: 1280 },
  { roleId: 'CLOUD', skillId: 'AZURE', level: 4, contractor: 580, associate: 820, top4: 1240 },
  { roleId: 'PLAT', skillId: 'K8S', level: 5, contractor: 700, associate: 1000, top4: 1500 },
  
  // Security
  { roleId: 'SECENG', skillId: 'AWS', level: 4, contractor: 625, associate: 880, top4: 1320 },
  { roleId: 'SECENG', skillId: 'AWS', level: 5, contractor: 725, associate: 1020, top4: 1540 },
  { roleId: 'SECARCH', skillId: 'AWS', level: 5, contractor: 800, associate: 1140, top4: 1720 },
  { roleId: 'SECARCH', skillId: 'AWS', level: 6, contractor: 925, associate: 1320, top4: 2000 },
  { roleId: 'PENT', skillId: 'AWS', level: 4, contractor: 650, associate: 920, top4: 1380 },
  
  // Project Management
  { roleId: 'PM', skillId: 'AGILE', level: 4, contractor: 550, associate: 780, top4: 1180 },
  { roleId: 'PM', skillId: 'AGILE', level: 5, contractor: 650, associate: 920, top4: 1380 },
  { roleId: 'SPM', skillId: 'AGILE', level: 5, contractor: 700, associate: 1000, top4: 1500 },
  { roleId: 'SPM', skillId: 'AGILE', level: 6, contractor: 800, associate: 1150, top4: 1720 },
  { roleId: 'DELM', skillId: 'AGILE', level: 5, contractor: 725, associate: 1030, top4: 1550 },
  { roleId: 'PROG', skillId: 'AGILE', level: 6, contractor: 900, associate: 1300, top4: 1950 },
  { roleId: 'PROG', skillId: 'AGILE', level: 7, contractor: 1050, associate: 1500, top4: 2250 },
  
  // Business Analysis
  { roleId: 'BA', skillId: 'AGILE', level: 3, contractor: 450, associate: 640, top4: 960 },
  { roleId: 'BA', skillId: 'AGILE', level: 4, contractor: 525, associate: 750, top4: 1120 },
  { roleId: 'SBA', skillId: 'AGILE', level: 4, contractor: 575, associate: 820, top4: 1220 },
  { roleId: 'SBA', skillId: 'AGILE', level: 5, contractor: 650, associate: 920, top4: 1380 },
  { roleId: 'PO', skillId: 'AGILE', level: 4, contractor: 600, associate: 850, top4: 1280 },
  { roleId: 'PO', skillId: 'AGILE', level: 5, contractor: 700, associate: 1000, top4: 1500 }
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getRoleName(roleId) {
  return ROLES.find(r => r.id === roleId)?.name || roleId;
}

function getSkillName(skillId) {
  return SKILLS.find(s => s.id === skillId)?.name || skillId;
}

function getFamilyName(familyId) {
  return ROLE_FAMILIES.find(f => f.id === familyId)?.name || familyId;
}

function getRoleFamily(roleId) {
  return ROLES.find(r => r.id === roleId)?.familyId || null;
}

function formatRate(rate) {
  return `£${rate.toLocaleString()}`;
}

function calculatePremium(base, compare) {
  if (!base || !compare) return null;
  return Math.round(((compare - base) / base) * 100);
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function Benchmarking() {
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

  // Filter options based on current selections
  const availableRoles = useMemo(() => {
    if (!filters.familyId) return ROLES;
    return ROLES.filter(r => r.familyId === filters.familyId);
  }, [filters.familyId]);

  // Filter and sort benchmark data
  const filteredData = useMemo(() => {
    let data = [...BENCHMARK_RATES];
    
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
  }, [filters, sortConfig]);

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
              <span>Daily rates in GBP • Source: ITJobsWatch, G-Cloud Dec 2025</span>
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
