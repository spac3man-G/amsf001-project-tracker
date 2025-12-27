/**
 * Benchmark Rates Service - SFIA 8 Edition
 * 
 * Global rate card for SFIA 8 skills - no project scoping.
 * Used by both Benchmarking and Estimator pages.
 * 
 * @version 2.0
 * @updated 27 December 2025
 * @description Full SFIA 8 framework with 97 skills
 */

import { BaseService } from './base.service';
import { supabase } from '../lib/supabase';

// Import SFIA 8 reference data
import {
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
  calculateDefaultRate
} from './sfia8-reference-data';

// Re-export reference data for use by components
export {
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
  calculateDefaultRate
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getSkillName(skillId) {
  return SFIA_SKILLS.find(s => s.id === skillId)?.name || skillId;
}

export function getSkillCode(skillId) {
  return SFIA_SKILLS.find(s => s.id === skillId)?.code || skillId;
}

export function getCategoryName(categoryId) {
  return SFIA_CATEGORIES.find(c => c.id === categoryId)?.name || categoryId;
}

export function getCategoryColor(categoryId) {
  return SFIA_CATEGORIES.find(c => c.id === categoryId)?.color || '#666';
}

export function getSubcategoryName(subcategoryId) {
  return SFIA_SUBCATEGORIES.find(sc => sc.id === subcategoryId)?.name || subcategoryId;
}

export function getTierName(tierId) {
  return TIERS.find(t => t.id === tierId)?.name || tierId;
}

export function getTierColor(tierId) {
  return TIERS.find(t => t.id === tierId)?.color || '#666';
}

export function getLevelTitle(levelId) {
  return SFIA_LEVELS.find(l => l.id === levelId)?.title || `Level ${levelId}`;
}

export function getLevelDescription(levelId) {
  return SFIA_LEVELS.find(l => l.id === levelId)?.description || '';
}

export function formatRate(rate) {
  return `£${Number(rate).toLocaleString()}`;
}

export function calculatePremium(base, compare) {
  if (!base || !compare) return null;
  return Math.round(((compare - base) / base) * 100);
}

/**
 * Get skills available at a specific SFIA level
 */
export function getSkillsForLevel(level) {
  return SFIA_SKILLS.filter(skill => skill.levels.includes(level));
}

/**
 * Get levels available for a specific skill
 */
export function getLevelsForSkill(skillId) {
  const skill = SFIA_SKILLS.find(s => s.id === skillId);
  return skill ? skill.levels : [];
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
        .order('category_id')
        .order('subcategory_id')
        .order('skill_id')
        .order('sfia_level')
        .order('tier_id');

      // Apply optional filters
      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters.subcategoryId) {
        query = query.eq('subcategory_id', filters.subcategoryId);
      }
      if (filters.skillId) {
        query = query.eq('skill_id', filters.skillId);
      }
      if (filters.sfiaLevel) {
        query = query.eq('sfia_level', filters.sfiaLevel);
      }
      if (filters.tierId) {
        query = query.eq('tier_id', filters.tierId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching benchmark rates:', error);
      throw error;
    }
  }

  /**
   * Get rate for specific skill/level/tier combination
   */
  async getRate(skillId, sfiaLevel, tierId) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('skill_id', skillId)
        .eq('sfia_level', sfiaLevel)
        .eq('tier_id', tierId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // If no rate found, calculate default
      if (!data) {
        const skill = getSkillById(skillId);
        return {
          skill_id: skillId,
          skill_name: skill?.name || skillId,
          sfia_level: sfiaLevel,
          tier_id: tierId,
          day_rate: calculateDefaultRate(skillId, sfiaLevel, tierId),
          source: 'Calculated default'
        };
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching rate:', error);
      throw error;
    }
  }

  /**
   * Get rates grouped by category for display
   */
  async getRatesGroupedByCategory() {
    try {
      const rates = await this.getAllRates();
      
      // Group by category
      const grouped = {};
      for (const category of SFIA_CATEGORIES) {
        grouped[category.id] = {
          ...category,
          subcategories: {}
        };
        
        // Add subcategories
        const subcats = SFIA_SUBCATEGORIES.filter(sc => sc.categoryId === category.id);
        for (const subcat of subcats) {
          grouped[category.id].subcategories[subcat.id] = {
            ...subcat,
            skills: {}
          };
        }
      }
      
      // Populate with rates
      for (const rate of rates) {
        const cat = grouped[rate.category_id];
        if (cat && cat.subcategories[rate.subcategory_id]) {
          const subcat = cat.subcategories[rate.subcategory_id];
          if (!subcat.skills[rate.skill_id]) {
            subcat.skills[rate.skill_id] = {
              id: rate.skill_id,
              name: rate.skill_name,
              code: rate.skill_code,
              rates: []
            };
          }
          subcat.skills[rate.skill_id].rates.push(rate);
        }
      }
      
      return grouped;
    } catch (error) {
      console.error('Error grouping rates:', error);
      throw error;
    }
  }

  /**
   * Update a rate
   */
  async updateRate(id, dayRate, notes = null) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .update({
          day_rate: dayRate,
          notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating rate:', error);
      throw error;
    }
  }

  /**
   * Create or update a rate (upsert)
   */
  async upsertRate(skillId, sfiaLevel, tierId, dayRate, source = 'Manual entry') {
    try {
      const skill = getSkillById(skillId);
      const subcat = SFIA_SUBCATEGORIES.find(sc => sc.id === skill?.subcategoryId);
      const tier = getTierById(tierId);
      
      const { data, error } = await supabase
        .from(this.tableName)
        .upsert({
          skill_id: skillId,
          skill_name: skill?.name || skillId,
          skill_code: skill?.code || skillId,
          subcategory_id: skill?.subcategoryId || 'UNKNOWN',
          category_id: subcat?.categoryId || 'UNKNOWN',
          sfia_level: sfiaLevel,
          tier_id: tierId,
          tier_name: tier?.name || tierId,
          day_rate: dayRate,
          source: source,
          effective_date: new Date().toISOString().split('T')[0]
        }, {
          onConflict: 'skill_id,sfia_level,tier_id'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error upserting rate:', error);
      throw error;
    }
  }

  /**
   * Get rate comparison across tiers for a skill/level
   */
  async getRateComparison(skillId, sfiaLevel) {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select('*')
        .eq('skill_id', skillId)
        .eq('sfia_level', sfiaLevel)
        .order('tier_id');

      if (error) throw error;
      
      // Calculate premiums vs contractor rate
      const contractorRate = data?.find(r => r.tier_id === 'contractor')?.day_rate;
      
      return (data || []).map(rate => ({
        ...rate,
        premium: contractorRate ? calculatePremium(contractorRate, rate.day_rate) : null
      }));
    } catch (error) {
      console.error('Error fetching rate comparison:', error);
      throw error;
    }
  }

  /**
   * Search skills by name or code
   */
  searchSkills(query) {
    const lowerQuery = query.toLowerCase();
    return SFIA_SKILLS.filter(skill => 
      skill.name.toLowerCase().includes(lowerQuery) ||
      skill.code.toLowerCase().includes(lowerQuery) ||
      skill.id.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Get summary statistics
   */
  async getStatistics() {
    try {
      const rates = await this.getAllRates();
      
      const stats = {
        totalRates: rates.length,
        skillsCovered: new Set(rates.map(r => r.skill_id)).size,
        totalSkills: SFIA_SKILLS.length,
        averageByTier: {},
        averageByLevel: {}
      };
      
      // Calculate averages by tier
      for (const tier of TIERS) {
        const tierRates = rates.filter(r => r.tier_id === tier.id);
        if (tierRates.length > 0) {
          stats.averageByTier[tier.id] = {
            name: tier.name,
            average: Math.round(tierRates.reduce((sum, r) => sum + Number(r.day_rate), 0) / tierRates.length),
            count: tierRates.length
          };
        }
      }
      
      // Calculate averages by level
      for (const level of SFIA_LEVELS) {
        const levelRates = rates.filter(r => r.sfia_level === level.id);
        if (levelRates.length > 0) {
          stats.averageByLevel[level.id] = {
            title: level.title,
            average: Math.round(levelRates.reduce((sum, r) => sum + Number(r.day_rate), 0) / levelRates.length),
            count: levelRates.length
          };
        }
      }
      
      return stats;
    } catch (error) {
      console.error('Error calculating statistics:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const benchmarkRatesService = new BenchmarkRatesService();
export default benchmarkRatesService;
