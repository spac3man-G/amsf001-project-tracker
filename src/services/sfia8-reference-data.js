/**
 * SFIA 8 Reference Data
 * 
 * Complete Skills Framework for the Information Age (SFIA) Version 8
 * 97 professional skills across 6 categories
 * 
 * @version 1.0
 * @created 27 December 2025
 * @source https://sfia-online.org/en/sfia-8
 */

// =============================================================================
// SFIA 8 CATEGORIES (6 categories)
// =============================================================================

export const SFIA_CATEGORIES = [
  { id: 'SA', name: 'Strategy and architecture', color: '#7c3aed' },
  { id: 'CT', name: 'Change and transformation', color: '#2563eb' },
  { id: 'DI', name: 'Development and implementation', color: '#059669' },
  { id: 'DO', name: 'Delivery and operation', color: '#d97706' },
  { id: 'SQ', name: 'Skills and quality', color: '#dc2626' },
  { id: 'RE', name: 'Relationships and engagement', color: '#0891b2' }
];

// =============================================================================
// SFIA 8 SUBCATEGORIES (19 subcategories)
// =============================================================================

export const SFIA_SUBCATEGORIES = [
  // Strategy and architecture
  { id: 'STRT', name: 'Strategy and planning', categoryId: 'SA' },
  { id: 'GOVR', name: 'Governance, risk and compliance', categoryId: 'SA' },
  { id: 'INFO', name: 'Information and data', categoryId: 'SA' },
  { id: 'SECU', name: 'Security and privacy', categoryId: 'SA' },
  
  // Change and transformation
  { id: 'CHPM', name: 'Change planning and management', categoryId: 'CT' },
  { id: 'BAPM', name: 'Business analysis and process management', categoryId: 'CT' },
  { id: 'UXPD', name: 'User experience and product design', categoryId: 'CT' },
  
  // Development and implementation
  { id: 'SYSD', name: 'Systems development', categoryId: 'DI' },
  { id: 'SDLC', name: 'Software development life cycle', categoryId: 'DI' },
  { id: 'DATA', name: 'Data and analytics development', categoryId: 'DI' },
  
  // Delivery and operation
  { id: 'TECH', name: 'Technology management', categoryId: 'DO' },
  { id: 'SVOP', name: 'Service operations', categoryId: 'DO' },
  { id: 'INFR', name: 'Infrastructure', categoryId: 'DO' },
  { id: 'SEOP', name: 'Security operations', categoryId: 'DO' },
  
  // Skills and quality
  { id: 'QUAL', name: 'Quality and assurance', categoryId: 'SQ' },
  { id: 'KNOW', name: 'Knowledge and learning', categoryId: 'SQ' },
  
  // Relationships and engagement
  { id: 'STKE', name: 'Stakeholder management', categoryId: 'RE' },
  { id: 'SALE', name: 'Sales and marketing', categoryId: 'RE' },
  { id: 'PEOP', name: 'People management', categoryId: 'RE' }
];

// =============================================================================
// SFIA 8 SKILLS (97 skills)
// =============================================================================

export const SFIA_SKILLS = [
  // =========================================================================
  // STRATEGY AND ARCHITECTURE (16 skills)
  // =========================================================================
  
  // Strategy and planning
  { id: 'ITSP', name: 'IT strategy and planning', code: 'ITSP', subcategoryId: 'STRT', levels: [5, 6, 7], description: 'Creating and maintaining IT strategies' },
  { id: 'STPL', name: 'Enterprise and business architecture', code: 'STPL', subcategoryId: 'STRT', levels: [5, 6, 7], description: 'Aligning IT strategy with business goals' },
  { id: 'BUSA', name: 'Business strategy and planning', code: 'BUSA', subcategoryId: 'STRT', levels: [5, 6, 7], description: 'Business strategy development' },
  { id: 'INOV', name: 'Innovation', code: 'INOV', subcategoryId: 'STRT', levels: [4, 5, 6], description: 'Identifying and exploiting new technologies' },
  { id: 'DEMM', name: 'Demand management', code: 'DEMM', subcategoryId: 'STRT', levels: [4, 5, 6], description: 'Analysing and managing IT demand' },
  
  // Governance, risk and compliance
  { id: 'GOVN', name: 'Governance', code: 'GOVN', subcategoryId: 'GOVR', levels: [5, 6, 7], description: 'IT governance frameworks' },
  { id: 'BURM', name: 'Business risk management', code: 'BURM', subcategoryId: 'GOVR', levels: [4, 5, 6, 7], description: 'Managing business and IT risks' },
  { id: 'COPL', name: 'Continuity management', code: 'COPL', subcategoryId: 'GOVR', levels: [3, 4, 5, 6], description: 'Business continuity planning' },
  { id: 'FMIT', name: 'Financial management', code: 'FMIT', subcategoryId: 'GOVR', levels: [4, 5, 6], description: 'IT financial management' },
  
  // Information and data  
  { id: 'IRMG', name: 'Information management', code: 'IRMG', subcategoryId: 'INFO', levels: [4, 5, 6, 7], description: 'Managing information assets' },
  { id: 'DTAN', name: 'Data modelling and design', code: 'DTAN', subcategoryId: 'INFO', levels: [3, 4, 5, 6], description: 'Designing data structures' },
  { id: 'INAN', name: 'Analytics', code: 'INAN', subcategoryId: 'INFO', levels: [3, 4, 5, 6], description: 'Applying analytics techniques' },
  { id: 'VISL', name: 'Data visualisation', code: 'VISL', subcategoryId: 'INFO', levels: [2, 3, 4, 5], description: 'Creating data visualisations' },
  
  // Security and privacy
  { id: 'SCTY', name: 'Information security', code: 'SCTY', subcategoryId: 'SECU', levels: [3, 4, 5, 6, 7], description: 'Information security strategy' },
  { id: 'INAS', name: 'Information assurance', code: 'INAS', subcategoryId: 'SECU', levels: [3, 4, 5, 6], description: 'Information assurance frameworks' },
  { id: 'PENT', name: 'Vulnerability assessment', code: 'PENT', subcategoryId: 'SECU', levels: [3, 4, 5, 6], description: 'Penetration testing and vulnerability assessment' },
  
  // =========================================================================
  // CHANGE AND TRANSFORMATION (12 skills)
  // =========================================================================
  
  // Change planning and management
  { id: 'PRMG', name: 'Project management', code: 'PRMG', subcategoryId: 'CHPM', levels: [3, 4, 5, 6, 7], description: 'Managing projects' },
  { id: 'PGMG', name: 'Programme management', code: 'PGMG', subcategoryId: 'CHPM', levels: [5, 6, 7], description: 'Managing programmes' },
  { id: 'POMG', name: 'Portfolio management', code: 'POMG', subcategoryId: 'CHPM', levels: [5, 6, 7], description: 'Managing portfolios' },
  { id: 'CIPM', name: 'Organisational change management', code: 'CIPM', subcategoryId: 'CHPM', levels: [4, 5, 6], description: 'Managing organisational change' },
  { id: 'BENM', name: 'Benefits management', code: 'BENM', subcategoryId: 'CHPM', levels: [4, 5, 6], description: 'Managing benefits realisation' },
  
  // Business analysis and process management
  { id: 'BUAN', name: 'Business analysis', code: 'BUAN', subcategoryId: 'BAPM', levels: [3, 4, 5, 6], description: 'Business analysis' },
  { id: 'REQM', name: 'Requirements definition and management', code: 'REQM', subcategoryId: 'BAPM', levels: [2, 3, 4, 5, 6], description: 'Managing requirements' },
  { id: 'BPRE', name: 'Business process improvement', code: 'BPRE', subcategoryId: 'BAPM', levels: [3, 4, 5, 6], description: 'Improving business processes' },
  
  // User experience and product design
  { id: 'HCEV', name: 'User experience design', code: 'HCEV', subcategoryId: 'UXPD', levels: [2, 3, 4, 5, 6], description: 'Designing user experiences' },
  { id: 'URCH', name: 'User research', code: 'URCH', subcategoryId: 'UXPD', levels: [3, 4, 5, 6], description: 'Conducting user research' },
  { id: 'PROD', name: 'Product management', code: 'PROD', subcategoryId: 'UXPD', levels: [3, 4, 5, 6], description: 'Managing product development' },
  { id: 'INCA', name: 'Content design', code: 'INCA', subcategoryId: 'UXPD', levels: [2, 3, 4, 5], description: 'Designing content' },
  
  // =========================================================================
  // DEVELOPMENT AND IMPLEMENTATION (20 skills)
  // =========================================================================
  
  // Systems development
  { id: 'ARCH', name: 'Solution architecture', code: 'ARCH', subcategoryId: 'SYSD', levels: [4, 5, 6], description: 'Designing solution architectures' },
  { id: 'NTDS', name: 'Network design', code: 'NTDS', subcategoryId: 'SYSD', levels: [3, 4, 5, 6], description: 'Designing network solutions' },
  { id: 'DBDS', name: 'Database design', code: 'DBDS', subcategoryId: 'SYSD', levels: [3, 4, 5, 6], description: 'Designing databases' },
  { id: 'DESN', name: 'Systems design', code: 'DESN', subcategoryId: 'SYSD', levels: [3, 4, 5, 6], description: 'Designing systems' },
  { id: 'SWDN', name: 'Software design', code: 'SWDN', subcategoryId: 'SYSD', levels: [3, 4, 5, 6], description: 'Designing software' },
  
  // Software development life cycle
  { id: 'PROG', name: 'Programming/software development', code: 'PROG', subcategoryId: 'SDLC', levels: [2, 3, 4, 5, 6], description: 'Software development' },
  { id: 'SINT', name: 'Systems integration and build', code: 'SINT', subcategoryId: 'SDLC', levels: [2, 3, 4, 5, 6], description: 'Integrating systems' },
  { id: 'TEST', name: 'Testing', code: 'TEST', subcategoryId: 'SDLC', levels: [1, 2, 3, 4, 5, 6], description: 'Software testing' },
  { id: 'RELM', name: 'Release and deployment', code: 'RELM', subcategoryId: 'SDLC', levels: [3, 4, 5, 6], description: 'Managing releases' },
  { id: 'CFMG', name: 'Configuration management', code: 'CFMG', subcategoryId: 'SDLC', levels: [2, 3, 4, 5, 6], description: 'Managing configurations' },
  { id: 'DLMG', name: 'Systems and software life cycle engineering', code: 'DLMG', subcategoryId: 'SDLC', levels: [4, 5, 6], description: 'Life cycle engineering' },
  { id: 'PORT', name: 'Porting/software configuration', code: 'PORT', subcategoryId: 'SDLC', levels: [2, 3, 4, 5], description: 'Software porting' },
  
  // Data and analytics development
  { id: 'DATS', name: 'Data science', code: 'DATS', subcategoryId: 'DATA', levels: [3, 4, 5, 6], description: 'Applying data science' },
  { id: 'MLNG', name: 'Machine learning', code: 'MLNG', subcategoryId: 'DATA', levels: [3, 4, 5, 6], description: 'Developing ML solutions' },
  { id: 'DENG', name: 'Data engineering', code: 'DENG', subcategoryId: 'DATA', levels: [3, 4, 5, 6], description: 'Building data pipelines' },
  
  // =========================================================================
  // DELIVERY AND OPERATION (28 skills)
  // =========================================================================
  
  // Technology management
  { id: 'ITMG', name: 'IT management', code: 'ITMG', subcategoryId: 'TECH', levels: [4, 5, 6, 7], description: 'Managing IT services' },
  { id: 'CPMG', name: 'Capacity management', code: 'CPMG', subcategoryId: 'TECH', levels: [3, 4, 5, 6], description: 'Managing capacity' },
  { id: 'AVMT', name: 'Availability management', code: 'AVMT', subcategoryId: 'TECH', levels: [3, 4, 5, 6], description: 'Managing availability' },
  { id: 'SLMO', name: 'Service level management', code: 'SLMO', subcategoryId: 'TECH', levels: [3, 4, 5, 6], description: 'Managing service levels' },
  
  // Service operations
  { id: 'SVMG', name: 'Service management', code: 'SVMG', subcategoryId: 'SVOP', levels: [3, 4, 5, 6], description: 'Managing services' },
  { id: 'USUP', name: 'Incident management', code: 'USUP', subcategoryId: 'SVOP', levels: [1, 2, 3, 4, 5], description: 'Managing incidents' },
  { id: 'PBMG', name: 'Problem management', code: 'PBMG', subcategoryId: 'SVOP', levels: [3, 4, 5, 6], description: 'Managing problems' },
  { id: 'CHMG', name: 'Change control', code: 'CHMG', subcategoryId: 'SVOP', levels: [2, 3, 4, 5, 6], description: 'Managing changes' },
  { id: 'SEAC', name: 'Service acceptance', code: 'SEAC', subcategoryId: 'SVOP', levels: [3, 4, 5, 6], description: 'Accepting services' },
  
  // Infrastructure
  { id: 'ITOP', name: 'IT infrastructure', code: 'ITOP', subcategoryId: 'INFR', levels: [1, 2, 3, 4, 5], description: 'Managing IT infrastructure' },
  { id: 'DBAD', name: 'Database administration', code: 'DBAD', subcategoryId: 'INFR', levels: [2, 3, 4, 5], description: 'Administering databases' },
  { id: 'NTAS', name: 'Network support', code: 'NTAS', subcategoryId: 'INFR', levels: [1, 2, 3, 4, 5], description: 'Supporting networks' },
  { id: 'STMG', name: 'Storage management', code: 'STMG', subcategoryId: 'INFR', levels: [3, 4, 5], description: 'Managing storage' },
  { id: 'HWMG', name: 'Systems installation/decommissioning', code: 'HWMG', subcategoryId: 'INFR', levels: [1, 2, 3, 4, 5], description: 'Installing systems' },
  { id: 'ASUP', name: 'Application support', code: 'ASUP', subcategoryId: 'INFR', levels: [2, 3, 4, 5], description: 'Supporting applications' },
  { id: 'DCMA', name: 'Data centre facilities management', code: 'DCMA', subcategoryId: 'INFR', levels: [3, 4, 5, 6], description: 'Managing data centres' },
  
  // Security operations
  { id: 'SCAD', name: 'Security administration', code: 'SCAD', subcategoryId: 'SEOP', levels: [1, 2, 3, 4, 5], description: 'Administering security' },
  { id: 'THIN', name: 'Threat intelligence', code: 'THIN', subcategoryId: 'SEOP', levels: [3, 4, 5, 6], description: 'Threat intelligence' },
  { id: 'VUAS', name: 'Vulnerability research', code: 'VUAS', subcategoryId: 'SEOP', levels: [3, 4, 5, 6], description: 'Researching vulnerabilities' },
  { id: 'DFOR', name: 'Digital forensics', code: 'DFOR', subcategoryId: 'SEOP', levels: [3, 4, 5, 6], description: 'Digital forensics' },
  { id: 'SCOP', name: 'Security operations', code: 'SCOP', subcategoryId: 'SEOP', levels: [2, 3, 4, 5, 6], description: 'Security operations' },
  
  // =========================================================================
  // SKILLS AND QUALITY (12 skills)
  // =========================================================================
  
  // Quality and assurance
  { id: 'QUMG', name: 'Quality management', code: 'QUMG', subcategoryId: 'QUAL', levels: [4, 5, 6, 7], description: 'Managing quality' },
  { id: 'QUAS', name: 'Quality assurance', code: 'QUAS', subcategoryId: 'QUAL', levels: [3, 4, 5, 6], description: 'Quality assurance' },
  { id: 'METL', name: 'Methods and tools', code: 'METL', subcategoryId: 'QUAL', levels: [3, 4, 5, 6], description: 'Managing methods and tools' },
  { id: 'MEAS', name: 'Measurement', code: 'MEAS', subcategoryId: 'QUAL', levels: [3, 4, 5, 6], description: 'IT measurement' },
  { id: 'SFEN', name: 'Safety engineering', code: 'SFEN', subcategoryId: 'QUAL', levels: [3, 4, 5, 6], description: 'Safety engineering' },
  { id: 'SFAS', name: 'Safety assessment', code: 'SFAS', subcategoryId: 'QUAL', levels: [3, 4, 5, 6], description: 'Safety assessment' },
  
  // Knowledge and learning
  { id: 'KNOW', name: 'Knowledge management', code: 'KNOW', subcategoryId: 'KNOW', levels: [3, 4, 5, 6], description: 'Managing knowledge' },
  { id: 'LEDA', name: 'Learning design and development', code: 'LEDA', subcategoryId: 'KNOW', levels: [3, 4, 5, 6], description: 'Designing learning' },
  { id: 'ETDM', name: 'Learning delivery', code: 'ETDM', subcategoryId: 'KNOW', levels: [2, 3, 4, 5], description: 'Delivering learning' },
  { id: 'TEAW', name: 'Technical writing', code: 'TEAW', subcategoryId: 'KNOW', levels: [2, 3, 4, 5], description: 'Technical authoring' },
  { id: 'TMCR', name: 'Specialist advice', code: 'TMCR', subcategoryId: 'KNOW', levels: [4, 5, 6], description: 'Providing specialist advice' },
  { id: 'OCDV', name: 'Organisational capability development', code: 'OCDV', subcategoryId: 'KNOW', levels: [4, 5, 6, 7], description: 'Developing organisational capability' },
  
  // =========================================================================
  // RELATIONSHIPS AND ENGAGEMENT (9 skills)
  // =========================================================================
  
  // Stakeholder management
  { id: 'RLMT', name: 'Stakeholder relationship management', code: 'RLMT', subcategoryId: 'STKE', levels: [4, 5, 6, 7], description: 'Managing stakeholder relationships' },
  { id: 'SORC', name: 'Sourcing', code: 'SORC', subcategoryId: 'STKE', levels: [4, 5, 6, 7], description: 'IT sourcing' },
  { id: 'SUPM', name: 'Supplier management', code: 'SUPM', subcategoryId: 'STKE', levels: [3, 4, 5, 6], description: 'Managing suppliers' },
  { id: 'CNSL', name: 'Consultancy', code: 'CNSL', subcategoryId: 'STKE', levels: [4, 5, 6, 7], description: 'Consultancy services' },
  
  // Sales and marketing
  { id: 'MKTG', name: 'Marketing', code: 'MKTG', subcategoryId: 'SALE', levels: [3, 4, 5, 6], description: 'IT marketing' },
  { id: 'SSUP', name: 'Sales support', code: 'SSUP', subcategoryId: 'SALE', levels: [2, 3, 4, 5], description: 'Sales support' },
  { id: 'SLEN', name: 'Selling', code: 'SLEN', subcategoryId: 'SALE', levels: [3, 4, 5, 6], description: 'IT sales' },
  
  // People management
  { id: 'PEMT', name: 'People management', code: 'PEMT', subcategoryId: 'PEOP', levels: [4, 5, 6, 7], description: 'Managing people' },
  { id: 'RESA', name: 'Resourcing', code: 'RESA', subcategoryId: 'PEOP', levels: [3, 4, 5, 6], description: 'IT resourcing' }
];

// =============================================================================
// SFIA LEVELS (7 levels)
// =============================================================================

export const SFIA_LEVELS = [
  { id: 1, name: 'Level 1', title: 'Follow', description: 'Works under close direction. Uses little discretion.' },
  { id: 2, name: 'Level 2', title: 'Assist', description: 'Works under routine direction. Uses limited discretion.' },
  { id: 3, name: 'Level 3', title: 'Apply', description: 'Works under general direction. Uses discretion in identifying and resolving complex problems.' },
  { id: 4, name: 'Level 4', title: 'Enable', description: 'Works under general direction within a clear framework. Substantial personal responsibility.' },
  { id: 5, name: 'Level 5', title: 'Ensure, advise', description: 'Works under broad direction. Full accountability for own technical work.' },
  { id: 6, name: 'Level 6', title: 'Initiate, influence', description: 'Has defined authority and accountability for actions and decisions.' },
  { id: 7, name: 'Level 7', title: 'Set strategy, inspire', description: 'Highest level of organisational authority and accountability.' }
];

// =============================================================================
// SUPPLIER TIERS
// =============================================================================

export const TIERS = [
  { id: 'contractor', name: 'Contractor/Independent', color: '#2563eb', description: 'Direct contractor engagement' },
  { id: 'boutique', name: 'Boutique/SME', color: '#059669', description: 'Specialist smaller consultancies' },
  { id: 'mid', name: 'Mid-tier', color: '#d97706', description: 'Mid-sized consultancies (Capgemini, CGI, etc.)' },
  { id: 'big4', name: 'Big 4/Global SI', color: '#7c3aed', description: 'Deloitte, PwC, EY, KPMG, Accenture, etc.' }
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getSkillById(skillId) {
  return SFIA_SKILLS.find(s => s.id === skillId);
}

export function getSkillsByCategory(categoryId) {
  const subcats = SFIA_SUBCATEGORIES.filter(sc => sc.categoryId === categoryId);
  const subcatIds = subcats.map(sc => sc.id);
  return SFIA_SKILLS.filter(s => subcatIds.includes(s.subcategoryId));
}

export function getSkillsBySubcategory(subcategoryId) {
  return SFIA_SKILLS.filter(s => s.subcategoryId === subcategoryId);
}

export function getCategoryById(categoryId) {
  return SFIA_CATEGORIES.find(c => c.id === categoryId);
}

export function getSubcategoryById(subcategoryId) {
  return SFIA_SUBCATEGORIES.find(sc => sc.id === subcategoryId);
}

export function getLevelById(levelId) {
  return SFIA_LEVELS.find(l => l.id === levelId);
}

export function getTierById(tierId) {
  return TIERS.find(t => t.id === tierId);
}

// =============================================================================
// DEFAULT RATE CALCULATOR
// =============================================================================

/**
 * Calculate default day rate based on skill, level, and tier
 * Uses UK market rates as baseline (December 2025)
 */
export function calculateDefaultRate(skillId, level, tierId) {
  // Base rates by level (contractor rates as baseline)
  const baseRates = {
    1: 250,
    2: 350,
    3: 450,
    4: 550,
    5: 700,
    6: 900,
    7: 1100
  };
  
  // Tier multipliers
  const tierMultipliers = {
    contractor: 1.0,
    boutique: 1.3,
    mid: 1.5,
    big4: 1.9
  };
  
  // Skill premium adjustments (some skills command higher rates)
  const skillPremiums = {
    // High demand/specialist skills
    MLNG: 1.25,   // Machine Learning
    DATS: 1.20,   // Data Science
    SCTY: 1.20,   // Security
    ARCH: 1.15,   // Solution Architecture
    PENT: 1.20,   // Penetration Testing
    THIN: 1.20,   // Threat Intelligence
    PGMG: 1.15,   // Programme Management
    NTDS: 1.10,   // Network Design
    
    // Standard skills
    PROG: 1.0,
    TEST: 0.95,
    BUAN: 1.0,
    PRMG: 1.05,
    
    // Lower demand
    TEAW: 0.85,
    ETDM: 0.85
  };
  
  const baseRate = baseRates[level] || 500;
  const tierMultiplier = tierMultipliers[tierId] || 1.0;
  const skillPremium = skillPremiums[skillId] || 1.0;
  
  return Math.round(baseRate * tierMultiplier * skillPremium / 5) * 5; // Round to nearest £5
}

/**
 * Generate all rate combinations for seeding
 */
export function generateAllRates() {
  const rates = [];
  
  for (const skill of SFIA_SKILLS) {
    for (const level of skill.levels) {
      for (const tier of TIERS) {
        rates.push({
          skill_id: skill.id,
          skill_name: skill.name,
          skill_code: skill.code,
          subcategory_id: skill.subcategoryId,
          sfia_level: level,
          tier_id: tier.id,
          tier_name: tier.name,
          day_rate: calculateDefaultRate(skill.id, level, tier.id),
          source: 'SFIA 8 / UK Market Dec 2025',
          effective_date: new Date().toISOString().split('T')[0]
        });
      }
    }
  }
  
  return rates;
}

export default {
  SFIA_CATEGORIES,
  SFIA_SUBCATEGORIES,
  SFIA_SKILLS,
  SFIA_LEVELS,
  TIERS,
  getSkillById,
  getSkillsByCategory,
  getSkillsBySubcategory,
  getCategoryById,
  getSubcategoryById,
  getLevelById,
  getTierById,
  calculateDefaultRate,
  generateAllRates
};
