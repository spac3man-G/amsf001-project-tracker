/**
 * Benchmark Rates Service
 * 
 * Global rate card for SFIA roles/skills - no project scoping.
 * Used by both Benchmarking and Estimator pages.
 * 
 * @version 1.0
 * @created 26 December 2025
 * @checkpoint 1 - Linked Estimates Feature
 */

import { BaseService } from './base.service';
import { supabase } from '../lib/supabase';

// =============================================================================
// STATIC REFERENCE DATA (for dropdowns, not stored in DB)
// =============================================================================

export const ROLE_FAMILIES = [
  { id: 'SE', name: 'Software Engineering', icon: '💻' },
  { id: 'DA', name: 'Data & Analytics', icon: '📊' },
  { id: 'DEVOPS', name: 'DevOps & Cloud', icon: '☁️' },
  { id: 'BA', name: 'Business Analysis', icon: '📋' },
  { id: 'SEC', name: 'Security', icon: '🔒' },
  { id: 'PM', name: 'Project Management', icon: '📁' }
];

export const ROLES = [
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

export const SKILLS = [
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

export const TIERS = [
  { id: 'contractor', name: 'Contractor', color: '#2563eb' },
  { id: 'associate', name: 'Associate', color: '#059669' },
  { id: 'top4', name: 'Top 4', color: '#7c3aed' }
];

export const SFIA_LEVELS = [
  { id: 1, name: 'Level 1', description: 'Follow' },
  { id: 2, name: 'Level 2', description: 'Assist' },
  { id: 3, name: 'Level 3', description: 'Apply' },
  { id: 4, name: 'Level 4', description: 'Enable' },
  { id: 5, name: 'Level 5', description: 'Ensure/Advise' },
  { id: 6, name: 'Level 6', description: 'Initiate/Influence' },
  { id: 7, name: 'Level 7', description: 'Set Strategy' }
];


// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getRoleName(roleId) {
  return ROLES.find(r => r.id === roleId)?.name || roleId;
}

export function getSkillName(skillId) {
  return SKILLS.find(s => s.id === skillId)?.name || skillId;
}

export function getFamilyName(familyId) {
  return ROLE_FAMILIES.find(f => f.id === familyId)?.name || familyId;
}

export function getFamilyIcon(familyId) {
  return ROLE_FAMILIES.find(f => f.id === familyId)?.icon || '📦';
}

export function getRoleFamily(roleId) {
  return ROLES.find(r => r.id === roleId)?.familyId || null;
}

export function getTierName(tierId) {
  return TIERS.find(t => t.id === tierId)?.name || tierId;
}

export function getTierColor(tierId) {
  return TIERS.find(t => t.id === tierId)?.color || '#666';
}

export function formatRate(rate) {
  return `£${Number(rate).toLocaleString()}`;
}

export function calculatePremium(base, compare) {
  if (!base || !compare) return null;
  return Math.round(((compare - base) / base) * 100);
}

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class BenchmarkRatesService extends BaseService {
  constructor() {
    super('benchmark_rates', {
      supportsSoftDelete: false  // Global data, no soft delete
    });
  }

  /**
   * Get all rates (no project filter - global data)
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} Array of rate records
   */
  async getAllRates(filters = {}) {
    try {
      let query = supabase
        .from(this.tableName)
        .select('*')
        .order('role_family_id')
        .order('role_id')
        .order('skill_id')
        .order('sfia_level');

      if (filters.roleFamily) {
        query = query.eq('role_family_id', filters.roleFamily);
      }
      if (filters.role) {
        query = query.eq('role_id', filters.role);
      }
      if (filters.skill) {
        query = query.eq('skill_id', filters.skill);
      }
      if (filters.minLevel) {
        query = query.gte('sfia_level', filters.minLevel);
      }
      if (filters.maxLevel) {
        query = query.lte('sfia_level', filters.maxLevel);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('BenchmarkRatesService.getAllRates error:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('BenchmarkRatesService.getAllRates failed:', error);
      throw error;
    }
  }

  /**
   * Get rate for specific combination
   * @param {string} roleId - Role ID
   * @param {string} skillId - Skill ID
   * @param {number} sfiaLevel - SFIA level (1-7)
   * @returns {Promise<Object|null>} Rate record or null
   */
  async getRate(roleId, skillId, sfiaLevel) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('role_id', roleId)
        .eq('skill_id', skillId)
        .eq('sfia_level', sfiaLevel)
        .limit(1);

      if (error) {
        console.error('BenchmarkRatesService.getRate error:', error);
        throw error;
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('BenchmarkRatesService.getRate failed:', error);
      throw error;
    }
  }


  /**
   * Get rate value for a specific tier
   * Used by Estimator for cost calculations
   * @param {string} roleId - Role ID
   * @param {string} skillId - Skill ID
   * @param {number} sfiaLevel - SFIA level
   * @param {string} tier - 'contractor', 'associate', or 'top4'
   * @returns {Promise<number|null>} Day rate in GBP or null
   */
  async getRateValue(roleId, skillId, sfiaLevel, tier) {
    try {
      const rate = await this.getRate(roleId, skillId, sfiaLevel);
      if (!rate) return null;
      
      switch (tier) {
        case 'contractor':
          return rate.contractor_rate;
        case 'associate':
          return rate.associate_rate;
        case 'top4':
          return rate.top4_rate;
        default:
          return null;
      }
    } catch (error) {
      console.error('BenchmarkRatesService.getRateValue failed:', error);
      throw error;
    }
  }

  /**
   * Get available skills for a role (based on existing rates)
   * @param {string} roleId - Role ID
   * @returns {Promise<Array>} Array of skill IDs with rates for this role
   */
  async getSkillsForRole(roleId) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('skill_id, skill_name')
        .eq('role_id', roleId)
        .order('skill_id');

      if (error) {
        console.error('BenchmarkRatesService.getSkillsForRole error:', error);
        throw error;
      }

      // Return unique skills
      const uniqueSkills = [];
      const seen = new Set();
      (data || []).forEach(row => {
        if (!seen.has(row.skill_id)) {
          seen.add(row.skill_id);
          uniqueSkills.push({ id: row.skill_id, name: row.skill_name });
        }
      });
      
      return uniqueSkills;
    } catch (error) {
      console.error('BenchmarkRatesService.getSkillsForRole failed:', error);
      throw error;
    }
  }

  /**
   * Get available SFIA levels for a role+skill combination
   * @param {string} roleId - Role ID
   * @param {string} skillId - Skill ID
   * @returns {Promise<Array>} Array of available SFIA levels
   */
  async getLevelsForRoleSkill(roleId, skillId) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('sfia_level')
        .eq('role_id', roleId)
        .eq('skill_id', skillId)
        .order('sfia_level');

      if (error) {
        console.error('BenchmarkRatesService.getLevelsForRoleSkill error:', error);
        throw error;
      }

      return (data || []).map(row => row.sfia_level);
    } catch (error) {
      console.error('BenchmarkRatesService.getLevelsForRoleSkill failed:', error);
      throw error;
    }
  }

  /**
   * Build rate lookup map (for Estimator compatibility)
   * Returns format: { 'DEV-JAVA-3-contractor': 525, ... }
   * @returns {Promise<Object>} Rate lookup map
   */
  async buildRateLookup() {
    try {
      const rates = await this.getAllRates();
      const lookup = {};
      
      rates.forEach(rate => {
        const baseKey = `${rate.role_id}-${rate.skill_id}-${rate.sfia_level}`;
        lookup[`${baseKey}-contractor`] = Number(rate.contractor_rate) || null;
        lookup[`${baseKey}-associate`] = Number(rate.associate_rate) || null;
        lookup[`${baseKey}-top4`] = Number(rate.top4_rate) || null;
      });
      
      return lookup;
    } catch (error) {
      console.error('BenchmarkRatesService.buildRateLookup failed:', error);
      throw error;
    }
  }


  /**
   * Seed initial rate data
   * Called during setup or migration
   * @param {Array} rates - Array of rate objects
   * @returns {Promise<number>} Number of records inserted
   */
  async seedRates(rates) {
    try {
      // Transform to database format
      const records = rates.map(rate => ({
        role_id: rate.roleId,
        role_name: getRoleName(rate.roleId),
        role_family_id: getRoleFamily(rate.roleId),
        role_family_name: getFamilyName(getRoleFamily(rate.roleId)),
        skill_id: rate.skillId,
        skill_name: getSkillName(rate.skillId),
        sfia_level: rate.level,
        contractor_rate: rate.contractor,
        associate_rate: rate.associate,
        top4_rate: rate.top4,
        source: rate.source || 'ITJobsWatch/G-Cloud Dec 2025',
        effective_date: new Date().toISOString().split('T')[0]
      }));

      // Use upsert to handle duplicates
      const { data, error } = await supabase
        .from(this.tableName)
        .upsert(records, { 
          onConflict: 'role_id,skill_id,sfia_level',
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error('BenchmarkRatesService.seedRates error:', error);
        throw error;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('BenchmarkRatesService.seedRates failed:', error);
      throw error;
    }
  }

  /**
   * Check if rates table has data
   * @returns {Promise<boolean>}
   */
  async hasRates() {
    try {
      const { data, error, count } = await supabase
        .from(this.tableName)
        .select('id', { count: 'exact', head: true });

      if (error) {
        console.error('BenchmarkRatesService.hasRates error:', error);
        return false;
      }

      return count > 0;
    } catch (error) {
      console.error('BenchmarkRatesService.hasRates failed:', error);
      return false;
    }
  }
}

// =============================================================================
// SINGLETON EXPORT
// =============================================================================

export const benchmarkRatesService = new BenchmarkRatesService();
export default benchmarkRatesService;
