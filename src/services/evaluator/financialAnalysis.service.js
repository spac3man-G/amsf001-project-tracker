/**
 * Financial Analysis Service
 *
 * Manages TCO calculations, cost breakdowns, sensitivity analysis, and ROI.
 * Part of Evaluator Product Roadmap v1.0.x - Feature 0.4
 *
 * @version 1.0
 * @created 09 January 2026
 */

import { supabase } from '../../lib/supabase';
import { EvaluatorBaseService } from './base.evaluator.service';

// ============================================================================
// CONSTANTS
// ============================================================================

export const COST_CATEGORIES = {
  LICENSE: 'license',
  IMPLEMENTATION: 'implementation',
  DATA_MIGRATION: 'data_migration',
  TRAINING: 'training',
  SUPPORT: 'support',
  INFRASTRUCTURE: 'infrastructure',
  INTEGRATION: 'integration',
  CUSTOMIZATION: 'customization',
  CONSULTING: 'consulting',
  TRAVEL: 'travel',
  CONTINGENCY: 'contingency',
  OTHER: 'other',
};

export const COST_CATEGORY_CONFIG = {
  [COST_CATEGORIES.LICENSE]: {
    label: 'License Fees',
    description: 'Software license fees',
    icon: 'key',
    color: '#6366f1',
    isTypicallyRecurring: true,
  },
  [COST_CATEGORIES.IMPLEMENTATION]: {
    label: 'Implementation',
    description: 'Implementation/setup costs',
    icon: 'settings',
    color: '#8b5cf6',
    isTypicallyRecurring: false,
  },
  [COST_CATEGORIES.DATA_MIGRATION]: {
    label: 'Data Migration',
    description: 'Data migration costs',
    icon: 'database',
    color: '#a855f7',
    isTypicallyRecurring: false,
  },
  [COST_CATEGORIES.TRAINING]: {
    label: 'Training',
    description: 'Training costs',
    icon: 'graduation-cap',
    color: '#d946ef',
    isTypicallyRecurring: false,
  },
  [COST_CATEGORIES.SUPPORT]: {
    label: 'Support & Maintenance',
    description: 'Annual support/maintenance',
    icon: 'headphones',
    color: '#ec4899',
    isTypicallyRecurring: true,
  },
  [COST_CATEGORIES.INFRASTRUCTURE]: {
    label: 'Infrastructure',
    description: 'Hardware/cloud infrastructure',
    icon: 'server',
    color: '#f43f5e',
    isTypicallyRecurring: true,
  },
  [COST_CATEGORIES.INTEGRATION]: {
    label: 'Integration',
    description: 'Integration development',
    icon: 'link',
    color: '#ef4444',
    isTypicallyRecurring: false,
  },
  [COST_CATEGORIES.CUSTOMIZATION]: {
    label: 'Customization',
    description: 'Customization/configuration',
    icon: 'wrench',
    color: '#f97316',
    isTypicallyRecurring: false,
  },
  [COST_CATEGORIES.CONSULTING]: {
    label: 'Consulting',
    description: 'Professional services',
    icon: 'briefcase',
    color: '#f59e0b',
    isTypicallyRecurring: false,
  },
  [COST_CATEGORIES.TRAVEL]: {
    label: 'Travel',
    description: 'Travel expenses',
    icon: 'plane',
    color: '#eab308',
    isTypicallyRecurring: false,
  },
  [COST_CATEGORIES.CONTINGENCY]: {
    label: 'Contingency',
    description: 'Contingency buffer',
    icon: 'shield',
    color: '#84cc16',
    isTypicallyRecurring: false,
  },
  [COST_CATEGORIES.OTHER]: {
    label: 'Other',
    description: 'Other costs',
    icon: 'more-horizontal',
    color: '#64748b',
    isTypicallyRecurring: false,
  },
};

export const ASSUMPTION_CATEGORIES = {
  GENERAL: 'general',
  COST: 'cost',
  TIMELINE: 'timeline',
  ADOPTION: 'adoption',
  GROWTH: 'growth',
  RISK: 'risk',
  DISCOUNT: 'discount',
};

export const ASSUMPTION_CATEGORY_CONFIG = {
  [ASSUMPTION_CATEGORIES.GENERAL]: {
    label: 'General',
    description: 'General assumptions',
  },
  [ASSUMPTION_CATEGORIES.COST]: {
    label: 'Cost',
    description: 'Cost-related assumptions',
  },
  [ASSUMPTION_CATEGORIES.TIMELINE]: {
    label: 'Timeline',
    description: 'Timeline-related assumptions',
  },
  [ASSUMPTION_CATEGORIES.ADOPTION]: {
    label: 'Adoption',
    description: 'User adoption assumptions',
  },
  [ASSUMPTION_CATEGORIES.GROWTH]: {
    label: 'Growth',
    description: 'Growth projections',
  },
  [ASSUMPTION_CATEGORIES.RISK]: {
    label: 'Risk',
    description: 'Risk factors',
  },
  [ASSUMPTION_CATEGORIES.DISCOUNT]: {
    label: 'Discount/Inflation',
    description: 'Discount and inflation rates',
  },
};

export const ADJUSTMENT_TYPES = {
  PERCENT: 'percent',
  FIXED: 'fixed',
  MULTIPLIER: 'multiplier',
};

export const BENEFIT_CATEGORIES = {
  EFFICIENCY: 'efficiency',
  COST_REDUCTION: 'cost_reduction',
  REVENUE: 'revenue',
  RISK_MITIGATION: 'risk_mitigation',
  COMPLIANCE: 'compliance',
  OTHER: 'other',
};

export const BENEFIT_CATEGORY_CONFIG = {
  [BENEFIT_CATEGORIES.EFFICIENCY]: {
    label: 'Efficiency Gains',
    description: 'Time and productivity savings',
  },
  [BENEFIT_CATEGORIES.COST_REDUCTION]: {
    label: 'Cost Reduction',
    description: 'Direct cost savings',
  },
  [BENEFIT_CATEGORIES.REVENUE]: {
    label: 'Revenue Impact',
    description: 'Revenue increases or protection',
  },
  [BENEFIT_CATEGORIES.RISK_MITIGATION]: {
    label: 'Risk Mitigation',
    description: 'Risk reduction value',
  },
  [BENEFIT_CATEGORIES.COMPLIANCE]: {
    label: 'Compliance',
    description: 'Regulatory compliance value',
  },
  [BENEFIT_CATEGORIES.OTHER]: {
    label: 'Other Benefits',
    description: 'Other quantifiable benefits',
  },
};

// ============================================================================
// SERVICE CLASS
// ============================================================================

class FinancialAnalysisService extends EvaluatorBaseService {
  constructor() {
    super('vendor_cost_breakdowns');
  }

  // ==========================================================================
  // COST BREAKDOWNS
  // ==========================================================================

  /**
   * Get all cost breakdowns for a project
   */
  async getCostBreakdowns(evaluationProjectId, vendorId = null) {
    let query = supabase
      .from('vendor_cost_breakdowns')
      .select(`
        *,
        vendor:vendors(id, vendor_name)
      `)
      .eq('evaluation_project_id', evaluationProjectId)
      .order('cost_category')
      .order('cost_description');

    if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Create a cost breakdown entry
   */
  async createCostBreakdown(data) {
    const { data: result, error } = await supabase
      .from('vendor_cost_breakdowns')
      .insert([{
        evaluation_project_id: data.evaluationProjectId,
        vendor_id: data.vendorId,
        cost_category: data.costCategory,
        cost_description: data.costDescription || null,
        year_1_cost: data.year1Cost || 0,
        year_2_cost: data.year2Cost || 0,
        year_3_cost: data.year3Cost || 0,
        year_4_cost: data.year4Cost || 0,
        year_5_cost: data.year5Cost || 0,
        is_recurring: data.isRecurring || false,
        is_estimated: data.isEstimated !== false,
        notes: data.notes || null,
        source: data.source || null,
        created_by: data.createdBy || null,
      }])
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  /**
   * Update a cost breakdown entry
   */
  async updateCostBreakdown(id, data) {
    const updateData = {};

    if (data.costCategory !== undefined) updateData.cost_category = data.costCategory;
    if (data.costDescription !== undefined) updateData.cost_description = data.costDescription;
    if (data.year1Cost !== undefined) updateData.year_1_cost = data.year1Cost;
    if (data.year2Cost !== undefined) updateData.year_2_cost = data.year2Cost;
    if (data.year3Cost !== undefined) updateData.year_3_cost = data.year3Cost;
    if (data.year4Cost !== undefined) updateData.year_4_cost = data.year4Cost;
    if (data.year5Cost !== undefined) updateData.year_5_cost = data.year5Cost;
    if (data.isRecurring !== undefined) updateData.is_recurring = data.isRecurring;
    if (data.isEstimated !== undefined) updateData.is_estimated = data.isEstimated;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.source !== undefined) updateData.source = data.source;

    const { data: result, error } = await supabase
      .from('vendor_cost_breakdowns')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  /**
   * Delete a cost breakdown entry
   */
  async deleteCostBreakdown(id) {
    const { error } = await supabase
      .from('vendor_cost_breakdowns')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  /**
   * Bulk import cost breakdowns for a vendor
   */
  async bulkImportCosts(evaluationProjectId, vendorId, costs, createdBy = null) {
    const records = costs.map(cost => ({
      evaluation_project_id: evaluationProjectId,
      vendor_id: vendorId,
      cost_category: cost.costCategory,
      cost_description: cost.costDescription || null,
      year_1_cost: cost.year1Cost || 0,
      year_2_cost: cost.year2Cost || 0,
      year_3_cost: cost.year3Cost || 0,
      year_4_cost: cost.year4Cost || 0,
      year_5_cost: cost.year5Cost || 0,
      is_recurring: cost.isRecurring || false,
      is_estimated: cost.isEstimated !== false,
      notes: cost.notes || null,
      source: cost.source || null,
      created_by: createdBy,
    }));

    const { data, error } = await supabase
      .from('vendor_cost_breakdowns')
      .upsert(records, {
        onConflict: 'evaluation_project_id,vendor_id,cost_category,cost_description',
        ignoreDuplicates: false
      })
      .select();

    if (error) throw error;
    return data;
  }

  // ==========================================================================
  // TCO CALCULATIONS
  // ==========================================================================

  /**
   * Calculate TCO for a vendor
   */
  async calculateTCO(evaluationProjectId, vendorId, options = {}) {
    const {
      tcoYears = 3,
      discountRate = 0,
      totalUsers = null,
      calculatedBy = null,
    } = options;

    // Get all cost breakdowns for this vendor
    const costs = await this.getCostBreakdowns(evaluationProjectId, vendorId);

    // Calculate yearly totals
    const yearTotals = {
      year1: 0,
      year2: 0,
      year3: 0,
      year4: 0,
      year5: 0,
    };

    costs.forEach(cost => {
      yearTotals.year1 += parseFloat(cost.year_1_cost) || 0;
      yearTotals.year2 += parseFloat(cost.year_2_cost) || 0;
      yearTotals.year3 += parseFloat(cost.year_3_cost) || 0;
      yearTotals.year4 += parseFloat(cost.year_4_cost) || 0;
      yearTotals.year5 += parseFloat(cost.year_5_cost) || 0;
    });

    // Calculate total TCO based on years
    let totalTCO = 0;
    const yearsArray = [yearTotals.year1, yearTotals.year2, yearTotals.year3, yearTotals.year4, yearTotals.year5];
    for (let i = 0; i < tcoYears; i++) {
      totalTCO += yearsArray[i];
    }

    // Calculate NPV if discount rate provided
    let npvTCO = 0;
    if (discountRate > 0) {
      for (let i = 0; i < tcoYears; i++) {
        npvTCO += yearsArray[i] / Math.pow(1 + discountRate, i);
      }
    } else {
      npvTCO = totalTCO;
    }

    // Calculate per-user metrics
    let costPerUserPerYear = null;
    let costPerUserPerMonth = null;
    if (totalUsers && totalUsers > 0) {
      costPerUserPerYear = totalTCO / tcoYears / totalUsers;
      costPerUserPerMonth = costPerUserPerYear / 12;
    }

    // Upsert TCO summary
    const { data: summary, error } = await supabase
      .from('vendor_tco_summaries')
      .upsert({
        evaluation_project_id: evaluationProjectId,
        vendor_id: vendorId,
        tco_years: tcoYears,
        discount_rate: discountRate,
        year_1_total: yearTotals.year1,
        year_2_total: yearTotals.year2,
        year_3_total: yearTotals.year3,
        year_4_total: yearTotals.year4,
        year_5_total: yearTotals.year5,
        total_tco: totalTCO,
        npv_tco: npvTCO,
        total_users: totalUsers,
        cost_per_user_per_year: costPerUserPerYear,
        cost_per_user_per_month: costPerUserPerMonth,
        calculated_at: new Date().toISOString(),
        calculated_by: calculatedBy,
      }, {
        onConflict: 'evaluation_project_id,vendor_id',
      })
      .select()
      .single();

    if (error) throw error;

    // Update rankings
    await this.updateTCORankings(evaluationProjectId);

    return summary;
  }

  /**
   * Calculate TCO for all vendors in a project
   */
  async calculateAllTCO(evaluationProjectId, options = {}) {
    // Get all vendors for this project
    const { data: vendors, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('evaluation_project_id', evaluationProjectId);

    if (vendorError) throw vendorError;

    const results = [];
    for (const vendor of vendors || []) {
      const tco = await this.calculateTCO(evaluationProjectId, vendor.id, options);
      results.push(tco);
    }

    return results;
  }

  /**
   * Update TCO rankings for all vendors
   */
  async updateTCORankings(evaluationProjectId) {
    // Get all TCO summaries ordered by total_tco
    const { data: summaries, error } = await supabase
      .from('vendor_tco_summaries')
      .select('id, vendor_id, total_tco')
      .eq('evaluation_project_id', evaluationProjectId)
      .order('total_tco', { ascending: true });

    if (error) throw error;
    if (!summaries || summaries.length === 0) return;

    const lowestTCO = summaries[0].total_tco;

    // Update each summary with rank and percent difference
    for (let i = 0; i < summaries.length; i++) {
      const summary = summaries[i];
      const percentVsLowest = lowestTCO > 0
        ? ((summary.total_tco - lowestTCO) / lowestTCO) * 100
        : 0;

      await supabase
        .from('vendor_tco_summaries')
        .update({
          tco_rank: i + 1,
          percent_vs_lowest: percentVsLowest,
        })
        .eq('id', summary.id);
    }
  }

  /**
   * Get TCO summaries for a project
   */
  async getTCOSummaries(evaluationProjectId) {
    const { data, error } = await supabase
      .from('vendor_tco_summaries')
      .select(`
        *,
        vendor:vendors(id, vendor_name)
      `)
      .eq('evaluation_project_id', evaluationProjectId)
      .order('tco_rank', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get TCO summary for a specific vendor
   */
  async getVendorTCO(evaluationProjectId, vendorId) {
    const { data, error } = await supabase
      .from('vendor_tco_summaries')
      .select(`
        *,
        vendor:vendors(id, vendor_name)
      `)
      .eq('evaluation_project_id', evaluationProjectId)
      .eq('vendor_id', vendorId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // ==========================================================================
  // SENSITIVITY ANALYSIS
  // ==========================================================================

  /**
   * Get all scenarios for a project
   */
  async getScenarios(evaluationProjectId) {
    const { data, error } = await supabase
      .from('sensitivity_scenarios')
      .select('*')
      .eq('evaluation_project_id', evaluationProjectId)
      .order('is_baseline', { ascending: false })
      .order('created_at');

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a sensitivity scenario
   */
  async createScenario(data) {
    const { data: result, error } = await supabase
      .from('sensitivity_scenarios')
      .insert([{
        evaluation_project_id: data.evaluationProjectId,
        scenario_name: data.scenarioName,
        scenario_description: data.scenarioDescription || null,
        is_baseline: data.isBaseline || false,
        adjustments: data.adjustments || [],
        created_by: data.createdBy || null,
      }])
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  /**
   * Update a scenario
   */
  async updateScenario(id, data) {
    const updateData = {};

    if (data.scenarioName !== undefined) updateData.scenario_name = data.scenarioName;
    if (data.scenarioDescription !== undefined) updateData.scenario_description = data.scenarioDescription;
    if (data.isBaseline !== undefined) updateData.is_baseline = data.isBaseline;
    if (data.adjustments !== undefined) updateData.adjustments = data.adjustments;
    if (data.results !== undefined) updateData.results = data.results;
    if (data.rankingChanged !== undefined) updateData.ranking_changed = data.rankingChanged;
    if (data.recommendationChanged !== undefined) updateData.recommendation_changed = data.recommendationChanged;
    if (data.analysisNotes !== undefined) updateData.analysis_notes = data.analysisNotes;

    const { data: result, error } = await supabase
      .from('sensitivity_scenarios')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  /**
   * Delete a scenario
   */
  async deleteScenario(id) {
    const { error } = await supabase
      .from('sensitivity_scenarios')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  /**
   * Run sensitivity analysis for a scenario
   */
  async runSensitivityAnalysis(scenarioId) {
    // Get the scenario
    const { data: scenario, error: scenarioError } = await supabase
      .from('sensitivity_scenarios')
      .select('*')
      .eq('id', scenarioId)
      .single();

    if (scenarioError) throw scenarioError;

    // Get baseline TCO summaries
    const tcoSummaries = await this.getTCOSummaries(scenario.evaluation_project_id);

    if (!tcoSummaries || tcoSummaries.length === 0) {
      throw new Error('No TCO data available. Please calculate TCO first.');
    }

    // Get cost breakdowns to apply adjustments
    const costBreakdowns = await this.getCostBreakdowns(scenario.evaluation_project_id);

    // Apply adjustments and calculate new TCO for each vendor
    const results = {};
    const baselineRanking = tcoSummaries.map(s => s.vendor_id);
    const adjustedTCOs = [];

    for (const summary of tcoSummaries) {
      const vendorCosts = costBreakdowns.filter(c => c.vendor_id === summary.vendor_id);
      let adjustedTotal = summary.total_tco;

      // Apply each adjustment
      for (const adjustment of scenario.adjustments || []) {
        const applicableCosts = this.getApplicableCosts(vendorCosts, adjustment.variable);
        const costSum = applicableCosts.reduce((sum, c) => {
          return sum + (parseFloat(c.year_1_cost) || 0) +
                       (parseFloat(c.year_2_cost) || 0) +
                       (parseFloat(c.year_3_cost) || 0);
        }, 0);

        switch (adjustment.adjustment_type) {
          case ADJUSTMENT_TYPES.PERCENT:
            adjustedTotal += costSum * (adjustment.value / 100);
            break;
          case ADJUSTMENT_TYPES.FIXED:
            adjustedTotal += adjustment.value;
            break;
          case ADJUSTMENT_TYPES.MULTIPLIER:
            adjustedTotal += costSum * (adjustment.value - 1);
            break;
        }
      }

      adjustedTCOs.push({
        vendorId: summary.vendor_id,
        vendorName: summary.vendor?.vendor_name,
        baselineTCO: summary.total_tco,
        adjustedTCO: adjustedTotal,
        difference: adjustedTotal - summary.total_tco,
        percentChange: summary.total_tco > 0
          ? ((adjustedTotal - summary.total_tco) / summary.total_tco) * 100
          : 0,
      });

      results[summary.vendor_id] = {
        adjusted_tco: adjustedTotal,
        baseline_tco: summary.total_tco,
        difference: adjustedTotal - summary.total_tco,
      };
    }

    // Sort by adjusted TCO and determine new ranking
    adjustedTCOs.sort((a, b) => a.adjustedTCO - b.adjustedTCO);
    const newRanking = adjustedTCOs.map(t => t.vendorId);

    // Check if ranking changed
    const rankingChanged = JSON.stringify(baselineRanking) !== JSON.stringify(newRanking);

    // Add rank change to results
    adjustedTCOs.forEach((item, index) => {
      const oldRank = baselineRanking.indexOf(item.vendorId) + 1;
      const newRank = index + 1;
      results[item.vendorId].old_rank = oldRank;
      results[item.vendorId].new_rank = newRank;
      results[item.vendorId].rank_change = oldRank - newRank;
    });

    // Update scenario with results
    const { data: updatedScenario, error } = await supabase
      .from('sensitivity_scenarios')
      .update({
        results,
        ranking_changed: rankingChanged,
        recommendation_changed: rankingChanged && baselineRanking[0] !== newRanking[0],
      })
      .eq('id', scenarioId)
      .select()
      .single();

    if (error) throw error;

    return {
      scenario: updatedScenario,
      details: adjustedTCOs,
      rankingChanged,
      recommendationChanged: rankingChanged && baselineRanking[0] !== newRanking[0],
    };
  }

  /**
   * Get costs applicable to an adjustment variable
   */
  getApplicableCosts(costs, variable) {
    // Map common variable names to cost categories
    const variableMap = {
      'implementation_cost': [COST_CATEGORIES.IMPLEMENTATION],
      'license_cost': [COST_CATEGORIES.LICENSE],
      'support_cost': [COST_CATEGORIES.SUPPORT],
      'training_cost': [COST_CATEGORIES.TRAINING],
      'integration_cost': [COST_CATEGORIES.INTEGRATION],
      'infrastructure_cost': [COST_CATEGORIES.INFRASTRUCTURE],
      'all_costs': Object.values(COST_CATEGORIES),
      'one_time_costs': Object.values(COST_CATEGORIES).filter(
        c => !COST_CATEGORY_CONFIG[c].isTypicallyRecurring
      ),
      'recurring_costs': Object.values(COST_CATEGORIES).filter(
        c => COST_CATEGORY_CONFIG[c].isTypicallyRecurring
      ),
    };

    const categories = variableMap[variable] || [variable];
    return costs.filter(c => categories.includes(c.cost_category));
  }

  // ==========================================================================
  // FINANCIAL ASSUMPTIONS
  // ==========================================================================

  /**
   * Get assumptions for a project
   */
  async getAssumptions(evaluationProjectId) {
    const { data, error } = await supabase
      .from('financial_assumptions')
      .select('*')
      .eq('evaluation_project_id', evaluationProjectId)
      .order('assumption_category')
      .order('assumption_name');

    if (error) throw error;
    return data || [];
  }

  /**
   * Create an assumption
   */
  async createAssumption(data) {
    const { data: result, error } = await supabase
      .from('financial_assumptions')
      .insert([{
        evaluation_project_id: data.evaluationProjectId,
        assumption_name: data.assumptionName,
        assumption_category: data.assumptionCategory,
        assumption_value: data.assumptionValue,
        assumption_unit: data.assumptionUnit || null,
        impact_description: data.impactDescription || null,
        applies_to: data.appliesTo || 'all',
        created_by: data.createdBy || null,
      }])
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  /**
   * Update an assumption
   */
  async updateAssumption(id, data) {
    const updateData = {};

    if (data.assumptionName !== undefined) updateData.assumption_name = data.assumptionName;
    if (data.assumptionCategory !== undefined) updateData.assumption_category = data.assumptionCategory;
    if (data.assumptionValue !== undefined) updateData.assumption_value = data.assumptionValue;
    if (data.assumptionUnit !== undefined) updateData.assumption_unit = data.assumptionUnit;
    if (data.impactDescription !== undefined) updateData.impact_description = data.impactDescription;
    if (data.appliesTo !== undefined) updateData.applies_to = data.appliesTo;

    const { data: result, error } = await supabase
      .from('financial_assumptions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  /**
   * Delete an assumption
   */
  async deleteAssumption(id) {
    const { error } = await supabase
      .from('financial_assumptions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  // ==========================================================================
  // ROI CALCULATIONS
  // ==========================================================================

  /**
   * Get ROI calculations for a project
   */
  async getROICalculations(evaluationProjectId) {
    const { data, error } = await supabase
      .from('roi_calculations')
      .select(`
        *,
        vendor:vendors(id, vendor_name)
      `)
      .eq('evaluation_project_id', evaluationProjectId)
      .order('roi_percent', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get ROI for a specific vendor
   */
  async getVendorROI(evaluationProjectId, vendorId) {
    const { data, error } = await supabase
      .from('roi_calculations')
      .select(`
        *,
        vendor:vendors(id, vendor_name)
      `)
      .eq('evaluation_project_id', evaluationProjectId)
      .eq('vendor_id', vendorId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  /**
   * Calculate ROI for a vendor
   */
  async calculateROI(evaluationProjectId, vendorId, data) {
    // Get TCO for this vendor
    const tco = await this.getVendorTCO(evaluationProjectId, vendorId);
    const totalCosts = tco?.total_tco || 0;

    // Calculate total benefits
    const benefits = data.benefitBreakdown || [];
    const tcoYears = tco?.tco_years || 3;

    let year1Benefits = 0;
    let year2Benefits = 0;
    let year3Benefits = 0;
    let year4Benefits = 0;
    let year5Benefits = 0;

    benefits.forEach(benefit => {
      const annualValue = parseFloat(benefit.annual_value) || 0;
      year1Benefits += benefit.year_1 !== undefined ? benefit.year_1 : annualValue;
      year2Benefits += benefit.year_2 !== undefined ? benefit.year_2 : annualValue;
      year3Benefits += benefit.year_3 !== undefined ? benefit.year_3 : annualValue;
      year4Benefits += benefit.year_4 !== undefined ? benefit.year_4 : annualValue;
      year5Benefits += benefit.year_5 !== undefined ? benefit.year_5 : annualValue;
    });

    // Calculate totals based on TCO years
    const yearBenefits = [year1Benefits, year2Benefits, year3Benefits, year4Benefits, year5Benefits];
    let totalBenefits = 0;
    for (let i = 0; i < tcoYears; i++) {
      totalBenefits += yearBenefits[i];
    }

    const netBenefit = totalBenefits - totalCosts;
    const roiPercent = totalCosts > 0 ? (netBenefit / totalCosts) * 100 : 0;

    // Calculate payback period (months)
    let paybackMonths = null;
    if (year1Benefits > 0) {
      const monthlyBenefit = year1Benefits / 12;
      let cumulativeBenefit = 0;
      let months = 0;
      const yearCosts = [
        tco?.year_1_total || 0,
        tco?.year_2_total || 0,
        tco?.year_3_total || 0,
      ];

      for (let year = 0; year < 3; year++) {
        const yearlyBenefit = yearBenefits[year];
        const monthlyCost = yearCosts[year] / 12;

        for (let month = 0; month < 12; month++) {
          months++;
          cumulativeBenefit += (yearlyBenefit / 12) - monthlyCost;
          if (cumulativeBenefit >= 0) {
            paybackMonths = months;
            break;
          }
        }
        if (paybackMonths) break;
      }
    }

    // Risk adjustment
    const riskAdjustment = data.riskAdjustmentPercent || 0;
    const riskAdjustedROI = roiPercent * (1 - riskAdjustment / 100);

    // Upsert ROI calculation
    const { data: result, error } = await supabase
      .from('roi_calculations')
      .upsert({
        evaluation_project_id: evaluationProjectId,
        vendor_id: vendorId,
        year_1_benefits: year1Benefits,
        year_2_benefits: year2Benefits,
        year_3_benefits: year3Benefits,
        year_4_benefits: year4Benefits,
        year_5_benefits: year5Benefits,
        benefit_breakdown: benefits,
        total_benefits: totalBenefits,
        total_costs: totalCosts,
        net_benefit: netBenefit,
        roi_percent: roiPercent,
        payback_months: paybackMonths,
        risk_adjustment_percent: riskAdjustment,
        risk_adjusted_roi: riskAdjustedROI,
        methodology_notes: data.methodologyNotes || null,
        assumptions_used: data.assumptionsUsed || null,
        calculated_at: new Date().toISOString(),
        calculated_by: data.calculatedBy || null,
      }, {
        onConflict: 'evaluation_project_id,vendor_id',
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  // ==========================================================================
  // DASHBOARD DATA
  // ==========================================================================

  /**
   * Get financial analysis dashboard data
   */
  async getDashboardData(evaluationProjectId) {
    const [
      costBreakdowns,
      tcoSummaries,
      scenarios,
      assumptions,
      roiCalculations,
    ] = await Promise.all([
      this.getCostBreakdowns(evaluationProjectId),
      this.getTCOSummaries(evaluationProjectId),
      this.getScenarios(evaluationProjectId),
      this.getAssumptions(evaluationProjectId),
      this.getROICalculations(evaluationProjectId),
    ]);

    // Calculate summary statistics
    const stats = {
      vendorsWithCosts: new Set(costBreakdowns.map(c => c.vendor_id)).size,
      totalCostEntries: costBreakdowns.length,
      tcoCalculated: tcoSummaries.length,
      scenariosCount: scenarios.length,
      assumptionsCount: assumptions.length,
      roiCalculated: roiCalculations.length,
    };

    // Find lowest/highest TCO
    if (tcoSummaries.length > 0) {
      const sorted = [...tcoSummaries].sort((a, b) => a.total_tco - b.total_tco);
      stats.lowestTCO = {
        vendorId: sorted[0].vendor_id,
        vendorName: sorted[0].vendor?.vendor_name,
        amount: sorted[0].total_tco,
      };
      stats.highestTCO = {
        vendorId: sorted[sorted.length - 1].vendor_id,
        vendorName: sorted[sorted.length - 1].vendor?.vendor_name,
        amount: sorted[sorted.length - 1].total_tco,
      };
      stats.tcoSpread = stats.highestTCO.amount - stats.lowestTCO.amount;
      stats.tcoSpreadPercent = stats.lowestTCO.amount > 0
        ? (stats.tcoSpread / stats.lowestTCO.amount) * 100
        : 0;
    }

    // Find best ROI
    if (roiCalculations.length > 0) {
      const bestROI = roiCalculations[0]; // Already sorted by roi_percent desc
      stats.bestROI = {
        vendorId: bestROI.vendor_id,
        vendorName: bestROI.vendor?.vendor_name,
        roiPercent: bestROI.roi_percent,
        paybackMonths: bestROI.payback_months,
      };
    }

    // Cost breakdown by category across all vendors
    const costByCategory = {};
    costBreakdowns.forEach(cost => {
      if (!costByCategory[cost.cost_category]) {
        costByCategory[cost.cost_category] = 0;
      }
      costByCategory[cost.cost_category] +=
        (parseFloat(cost.year_1_cost) || 0) +
        (parseFloat(cost.year_2_cost) || 0) +
        (parseFloat(cost.year_3_cost) || 0);
    });

    return {
      stats,
      costBreakdowns,
      tcoSummaries,
      scenarios,
      assumptions,
      roiCalculations,
      costByCategory,
    };
  }

  /**
   * Get cost comparison data for visualization
   */
  async getCostComparisonData(evaluationProjectId) {
    const costBreakdowns = await this.getCostBreakdowns(evaluationProjectId);
    const tcoSummaries = await this.getTCOSummaries(evaluationProjectId);

    // Group costs by vendor and category
    const vendorCosts = {};

    costBreakdowns.forEach(cost => {
      const vendorId = cost.vendor_id;
      const vendorName = cost.vendor?.vendor_name || 'Unknown';

      if (!vendorCosts[vendorId]) {
        vendorCosts[vendorId] = {
          vendorId,
          vendorName,
          categories: {},
          yearlyTotals: { year1: 0, year2: 0, year3: 0, year4: 0, year5: 0 },
        };
      }

      const category = cost.cost_category;
      if (!vendorCosts[vendorId].categories[category]) {
        vendorCosts[vendorId].categories[category] = 0;
      }

      vendorCosts[vendorId].categories[category] +=
        (parseFloat(cost.year_1_cost) || 0) +
        (parseFloat(cost.year_2_cost) || 0) +
        (parseFloat(cost.year_3_cost) || 0);

      vendorCosts[vendorId].yearlyTotals.year1 += parseFloat(cost.year_1_cost) || 0;
      vendorCosts[vendorId].yearlyTotals.year2 += parseFloat(cost.year_2_cost) || 0;
      vendorCosts[vendorId].yearlyTotals.year3 += parseFloat(cost.year_3_cost) || 0;
      vendorCosts[vendorId].yearlyTotals.year4 += parseFloat(cost.year_4_cost) || 0;
      vendorCosts[vendorId].yearlyTotals.year5 += parseFloat(cost.year_5_cost) || 0;
    });

    // Add TCO data
    tcoSummaries.forEach(tco => {
      if (vendorCosts[tco.vendor_id]) {
        vendorCosts[tco.vendor_id].tco = tco.total_tco;
        vendorCosts[tco.vendor_id].tcoRank = tco.tco_rank;
        vendorCosts[tco.vendor_id].percentVsLowest = tco.percent_vs_lowest;
      }
    });

    return Object.values(vendorCosts);
  }
}

// Export singleton instance
export const financialAnalysisService = new FinancialAnalysisService();
export { FinancialAnalysisService };
