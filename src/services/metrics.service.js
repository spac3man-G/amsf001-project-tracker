/**
 * Metrics Service
 * 
 * CENTRAL SOURCE OF TRUTH for all application metrics.
 * All metric calculations flow through this service to ensure consistency.
 * 
 * Provides real-time, calculated metrics based on:
 * - Current database state
 * - Valid status filtering (excludes rejected/deleted)
 * - Proper soft-delete handling
 * 
 * @version 1.0
 * @created 3 December 2025
 */

import { supabase } from '../lib/supabase';
import {
  VALID_STATUSES,
  SOFT_DELETE_FILTER,
  TEST_CONTENT_FILTER,
  BUDGET_CONFIG,
  KPI_CONFIG,
  QS_CONFIG,
  isPMORole,
  timesheetContributesToSpend,
  expenseContributesToSpend,
  deliverableContributesToKPIs
} from '../config/metricsConfig';

class MetricsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5000; // 5 second cache for rapid successive calls
  }

  /**
   * Clear all cached metrics
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cached value or null if expired/missing
   */
  getCached(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set cache value
   */
  setCache(key, data) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // ============================================================
  // MILESTONE METRICS
  // ============================================================

  /**
   * Get all milestone metrics for a project
   */
  async getMilestoneMetrics(projectId) {
    const cacheKey = `milestones_${projectId}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const { data: milestones, error } = await supabase
        .from('milestones')
        .select('id, milestone_ref, name, status, progress, budget, percent_complete')
        .eq('project_id', projectId)
        .or(SOFT_DELETE_FILTER.supabaseFilter)
        .order('milestone_ref');

      if (error) throw error;

      const metrics = {
        total: milestones.length,
        completed: milestones.filter(m => VALID_STATUSES.milestones.completed.includes(m.status)).length,
        inProgress: milestones.filter(m => VALID_STATUSES.milestones.inProgress.includes(m.status)).length,
        notStarted: milestones.filter(m => VALID_STATUSES.milestones.notStarted.includes(m.status)).length,
        totalBudget: milestones.reduce((sum, m) => sum + (m.budget || 0), 0),
        averageProgress: milestones.length > 0 
          ? Math.round(milestones.reduce((sum, m) => sum + (m.progress || 0), 0) / milestones.length)
          : 0,
        milestones // Include raw data for charts
      };

      this.setCache(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('MetricsService.getMilestoneMetrics error:', error);
      throw error;
    }
  }

  // ============================================================
  // DELIVERABLE METRICS
  // ============================================================

  /**
   * Get all deliverable metrics for a project
   */
  async getDeliverableMetrics(projectId, includeTestContent = false) {
    const cacheKey = `deliverables_${projectId}_${includeTestContent}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      let query = supabase
        .from('deliverables')
        .select('id, deliverable_ref, name, status, due_date, milestone_id')
        .eq('project_id', projectId)
        .or(SOFT_DELETE_FILTER.supabaseFilter);

      if (!includeTestContent) {
        query = query.or(TEST_CONTENT_FILTER.supabaseFilter);
      }

      const { data: deliverables, error } = await query.order('deliverable_ref');
      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];

      const metrics = {
        total: deliverables.length,
        delivered: deliverables.filter(d => VALID_STATUSES.deliverables.completed.includes(d.status)).length,
        inProgress: deliverables.filter(d => VALID_STATUSES.deliverables.inProgress.includes(d.status)).length,
        notStarted: deliverables.filter(d => VALID_STATUSES.deliverables.notStarted.includes(d.status)).length,
        overdue: deliverables.filter(d => 
          d.due_date < today && 
          !VALID_STATUSES.deliverables.completed.includes(d.status)
        ).length,
        dueThisWeek: deliverables.filter(d => 
          d.due_date >= today && 
          d.due_date <= nextWeekStr &&
          !VALID_STATUSES.deliverables.completed.includes(d.status)
        ).length,
        deliverables // Include raw data
      };

      // Calculate completion percentage
      metrics.completionPercent = metrics.total > 0 
        ? Math.round((metrics.delivered / metrics.total) * 100) 
        : 0;

      this.setCache(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('MetricsService.getDeliverableMetrics error:', error);
      throw error;
    }
  }

  // ============================================================
  // KPI METRICS (Assessment-Based)
  // ============================================================

  /**
   * Get KPI metrics based on assessments from delivered deliverables
   * Only counts assessments from non-deleted, delivered deliverables
   */
  async getKPIMetrics(projectId) {
    const cacheKey = `kpis_${projectId}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      // Get all KPIs
      const { data: kpis, error: kpiError } = await supabase
        .from('kpis')
        .select('id, kpi_ref, name, category, target, current_value')
        .eq('project_id', projectId)
        .or(SOFT_DELETE_FILTER.supabaseFilter)
        .order('kpi_ref');

      if (kpiError) throw kpiError;

      // Get assessments from DELIVERED deliverables
      // We fetch all and filter client-side for is_deleted to handle NULL values properly
      const { data: rawAssessments, error: assessError } = await supabase
        .from('deliverable_kpi_assessments')
        .select(`
          kpi_id,
          criteria_met,
          deliverables!inner(id, status, is_deleted, project_id)
        `)
        .eq('deliverables.project_id', projectId)
        .in('deliverables.status', VALID_STATUSES.deliverables.contributeToKPIs);

      if (assessError) {
        // Table might not exist or no assessments yet
        console.warn('KPI assessments query warning:', assessError.message);
      }

      // Filter out deleted deliverables (is_deleted must be null or false)
      const assessments = rawAssessments?.filter(a => 
        a.deliverables?.is_deleted !== true
      ) || [];

      // Calculate achievement per KPI based on assessments
      const kpiAchievement = new Map();
      
      if (assessments && assessments.length > 0) {
        // Group assessments by KPI
        assessments.forEach(a => {
          if (!kpiAchievement.has(a.kpi_id)) {
            kpiAchievement.set(a.kpi_id, { total: 0, met: 0 });
          }
          const stats = kpiAchievement.get(a.kpi_id);
          stats.total++;
          if (a.criteria_met) stats.met++;
        });
      }

      // Calculate metrics for each KPI
      const kpisWithMetrics = kpis.map(kpi => {
        const achievement = kpiAchievement.get(kpi.id);
        let calculatedValue = 0;
        
        if (achievement && achievement.total > 0) {
          calculatedValue = Math.round((achievement.met / achievement.total) * 100);
        }

        const target = kpi.target || KPI_CONFIG.defaultTarget;
        const isAchieved = calculatedValue >= target;

        return {
          ...kpi,
          calculatedValue,
          assessmentCount: achievement?.total || 0,
          assessmentsMet: achievement?.met || 0,
          isAchieved,
          ragStatus: calculatedValue >= target ? 'Green' 
            : calculatedValue >= target * (1 - KPI_CONFIG.amberThreshold / 100) ? 'Amber' 
            : 'Red'
        };
      });

      // Group by category
      const byCategory = {};
      kpisWithMetrics.forEach(kpi => {
        const category = kpi.category || 'Other';
        if (!byCategory[category]) byCategory[category] = [];
        byCategory[category].push(kpi);
      });

      const metrics = {
        total: kpis.length,
        achieved: kpisWithMetrics.filter(k => k.isAchieved).length,
        atRisk: kpisWithMetrics.filter(k => k.ragStatus === 'Amber').length,
        failing: kpisWithMetrics.filter(k => k.ragStatus === 'Red').length,
        achievementPercent: kpis.length > 0
          ? Math.round((kpisWithMetrics.filter(k => k.isAchieved).length / kpis.length) * 100)
          : 0,
        byCategory,
        kpis: kpisWithMetrics
      };

      this.setCache(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('MetricsService.getKPIMetrics error:', error);
      throw error;
    }
  }

  // ============================================================
  // QUALITY STANDARDS METRICS (Assessment-Based)
  // ============================================================

  /**
   * Get QS metrics based on assessments from delivered deliverables
   */
  async getQualityStandardMetrics(projectId) {
    const cacheKey = `qs_${projectId}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      // Get all Quality Standards
      const { data: standards, error: qsError } = await supabase
        .from('quality_standards')
        .select('id, qs_ref, name, category, target, current_value')
        .eq('project_id', projectId)
        .or(SOFT_DELETE_FILTER.supabaseFilter)
        .order('qs_ref');

      if (qsError) throw qsError;

      // Get assessments from DELIVERED deliverables
      // We fetch all and filter client-side for is_deleted to handle NULL values properly
      const { data: rawAssessments, error: assessError } = await supabase
        .from('deliverable_qs_assessments')
        .select(`
          quality_standard_id,
          criteria_met,
          deliverables!inner(id, status, is_deleted, project_id)
        `)
        .eq('deliverables.project_id', projectId)
        .in('deliverables.status', VALID_STATUSES.deliverables.contributeToQS);

      if (assessError) {
        console.warn('QS assessments query warning:', assessError.message);
      }

      // Filter out deleted deliverables (is_deleted must be null or false)
      const assessments = rawAssessments?.filter(a => 
        a.deliverables?.is_deleted !== true
      ) || [];

      // Calculate achievement per QS based on assessments
      const qsAchievement = new Map();
      
      if (assessments && assessments.length > 0) {
        assessments.forEach(a => {
          if (!qsAchievement.has(a.quality_standard_id)) {
            qsAchievement.set(a.quality_standard_id, { total: 0, met: 0 });
          }
          const stats = qsAchievement.get(a.quality_standard_id);
          stats.total++;
          if (a.criteria_met) stats.met++;
        });
      }

      // Calculate metrics for each QS
      const qsWithMetrics = standards.map(qs => {
        const achievement = qsAchievement.get(qs.id);
        let calculatedValue = 0;
        
        if (achievement && achievement.total > 0) {
          calculatedValue = Math.round((achievement.met / achievement.total) * 100);
        }

        const target = qs.target || QS_CONFIG.defaultTarget;
        const isAchieved = calculatedValue >= target;

        return {
          ...qs,
          calculatedValue,
          assessmentCount: achievement?.total || 0,
          assessmentsMet: achievement?.met || 0,
          isAchieved
        };
      });

      const metrics = {
        total: standards.length,
        achieved: qsWithMetrics.filter(q => q.isAchieved).length,
        partial: qsWithMetrics.filter(q => q.calculatedValue > 0 && !q.isAchieved).length,
        notMet: qsWithMetrics.filter(q => q.calculatedValue === 0).length,
        achievementPercent: standards.length > 0
          ? Math.round((qsWithMetrics.filter(q => q.isAchieved).length / standards.length) * 100)
          : 0,
        qualityStandards: qsWithMetrics
      };

      this.setCache(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('MetricsService.getQualityStandardMetrics error:', error);
      throw error;
    }
  }

  // ============================================================
  // TIMESHEET METRICS & SPEND
  // ============================================================

  /**
   * Get timesheet metrics and spend calculations
   * Only includes timesheets with valid statuses (Submitted, Validated, Approved)
   */
  async getTimesheetMetrics(projectId, includeTestUsers = false) {
    const cacheKey = `timesheets_${projectId}_${includeTestUsers}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      // Get timesheets with resource info
      let query = supabase
        .from('timesheets')
        .select(`
          id, date, hours_worked, hours, status, milestone_id, resource_id,
          resources(id, name, role, daily_rate)
        `)
        .eq('project_id', projectId)
        .or(SOFT_DELETE_FILTER.supabaseFilter);

      if (!includeTestUsers) {
        query = query.or(TEST_CONTENT_FILTER.supabaseFilter);
      }

      const { data: timesheets, error } = await query;
      if (error) throw error;

      // Calculate metrics
      let totalHours = 0;
      let totalSpend = 0;
      let pmoSpend = 0;
      let deliverySpend = 0;
      const spendByMilestone = {};
      const spendByResource = {};

      timesheets.forEach(ts => {
        const hours = parseFloat(ts.hours_worked || ts.hours || 0);
        const resource = ts.resources;
        const dailyRate = resource?.daily_rate || 0;
        const dayCost = (hours / BUDGET_CONFIG.hoursPerDay) * dailyRate;

        // Only count valid statuses toward spend
        if (timesheetContributesToSpend(ts.status)) {
          totalHours += hours;
          totalSpend += dayCost;

          // PMO vs Delivery categorisation
          if (isPMORole(resource?.role)) {
            pmoSpend += dayCost;
          } else {
            deliverySpend += dayCost;
          }

          // Spend by milestone
          if (ts.milestone_id) {
            spendByMilestone[ts.milestone_id] = (spendByMilestone[ts.milestone_id] || 0) + dayCost;
          }

          // Spend by resource
          if (ts.resource_id) {
            spendByResource[ts.resource_id] = (spendByResource[ts.resource_id] || 0) + dayCost;
          }
        }
      });

      const metrics = {
        totalEntries: timesheets.length,
        validEntries: timesheets.filter(ts => timesheetContributesToSpend(ts.status)).length,
        draftEntries: timesheets.filter(ts => ts.status === 'Draft').length,
        rejectedEntries: timesheets.filter(ts => ts.status === 'Rejected').length,
        totalHours,
        totalSpend,
        pmoSpend,
        deliverySpend,
        spendByMilestone,
        spendByResource
      };

      this.setCache(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('MetricsService.getTimesheetMetrics error:', error);
      throw error;
    }
  }

  // ============================================================
  // EXPENSE METRICS & SPEND
  // ============================================================

  /**
   * Get expense metrics and spend calculations
   * Only includes expenses with valid statuses
   */
  async getExpenseMetrics(projectId, includeTestUsers = false) {
    const cacheKey = `expenses_${projectId}_${includeTestUsers}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      let query = supabase
        .from('expenses')
        .select('id, date, amount, status, category, milestone_id, chargeable_to_customer, procurement_method')
        .eq('project_id', projectId)
        .or(SOFT_DELETE_FILTER.supabaseFilter);

      if (!includeTestUsers) {
        query = query.or(TEST_CONTENT_FILTER.supabaseFilter);
      }

      const { data: expenses, error } = await query;
      if (error) throw error;

      let totalAmount = 0;
      let chargeableAmount = 0;
      let nonChargeableAmount = 0;
      const byCategory = {};
      const byMilestone = {};

      expenses.forEach(exp => {
        const amount = parseFloat(exp.amount || 0);

        // Only count valid statuses
        if (expenseContributesToSpend(exp.status)) {
          totalAmount += amount;

          if (exp.chargeable_to_customer) {
            chargeableAmount += amount;
          } else {
            nonChargeableAmount += amount;
          }

          // By category
          const category = exp.category || 'Other';
          byCategory[category] = (byCategory[category] || 0) + amount;

          // By milestone
          if (exp.milestone_id) {
            byMilestone[exp.milestone_id] = (byMilestone[exp.milestone_id] || 0) + amount;
          }
        }
      });

      const metrics = {
        totalEntries: expenses.length,
        validEntries: expenses.filter(e => expenseContributesToSpend(e.status)).length,
        draftEntries: expenses.filter(e => e.status === 'Draft').length,
        rejectedEntries: expenses.filter(e => e.status === 'Rejected').length,
        totalAmount,
        chargeableAmount,
        nonChargeableAmount,
        byCategory,
        byMilestone
      };

      this.setCache(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('MetricsService.getExpenseMetrics error:', error);
      throw error;
    }
  }

  // ============================================================
  // RESOURCE METRICS
  // ============================================================

  /**
   * Get resource metrics including budget allocations
   */
  async getResourceMetrics(projectId) {
    const cacheKey = `resources_${projectId}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const { data: resources, error } = await supabase
        .from('resources')
        .select('id, name, role, daily_rate, days_allocated')
        .eq('project_id', projectId)
        .or(SOFT_DELETE_FILTER.supabaseFilter);

      if (error) throw error;

      let pmoBudget = 0;
      let deliveryBudget = 0;

      resources.forEach(r => {
        const budget = (r.daily_rate || 0) * (r.days_allocated || 0);
        if (isPMORole(r.role)) {
          pmoBudget += budget;
        } else {
          deliveryBudget += budget;
        }
      });

      const metrics = {
        total: resources.length,
        pmoCount: resources.filter(r => isPMORole(r.role)).length,
        deliveryCount: resources.filter(r => !isPMORole(r.role)).length,
        pmoBudget,
        deliveryBudget,
        totalBudget: pmoBudget + deliveryBudget,
        resources
      };

      this.setCache(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('MetricsService.getResourceMetrics error:', error);
      throw error;
    }
  }

  // ============================================================
  // CERTIFICATE METRICS
  // ============================================================

  /**
   * Get milestone certificate metrics
   */
  async getCertificateMetrics(projectId) {
    const cacheKey = `certificates_${projectId}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const { data: certificates, error } = await supabase
        .from('milestone_certificates')
        .select('id, milestone_id, status')
        .eq('project_id', projectId);

      if (error) throw error;

      // Get completed milestones count
      const milestoneMetrics = await this.getMilestoneMetrics(projectId);

      const metrics = {
        total: certificates?.length || 0,
        signed: certificates?.filter(c => c.status === 'Signed').length || 0,
        pending: certificates?.filter(c => 
          c.status === 'Pending Customer Signature' || 
          c.status === 'Pending Supplier Signature'
        ).length || 0,
        awaitingGeneration: Math.max(0, milestoneMetrics.completed - (certificates?.length || 0))
      };

      this.setCache(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('MetricsService.getCertificateMetrics error:', error);
      throw error;
    }
  }

  // ============================================================
  // AGGREGATED DASHBOARD METRICS
  // ============================================================

  /**
   * Get all metrics for the dashboard in a single call
   * This is the main entry point for dashboard data
   */
  async getAllDashboardMetrics(projectId, options = {}) {
    const { includeTestContent = false } = options;

    try {
      // Fetch all metrics in parallel for performance
      const [
        milestones,
        deliverables,
        kpis,
        qualityStandards,
        timesheets,
        expenses,
        resources,
        certificates
      ] = await Promise.all([
        this.getMilestoneMetrics(projectId),
        this.getDeliverableMetrics(projectId, includeTestContent),
        this.getKPIMetrics(projectId),
        this.getQualityStandardMetrics(projectId),
        this.getTimesheetMetrics(projectId, includeTestContent),
        this.getExpenseMetrics(projectId, includeTestContent),
        this.getResourceMetrics(projectId),
        this.getCertificateMetrics(projectId)
      ]);

      // Calculate combined budget metrics
      const budget = {
        totalBudget: milestones.totalBudget,
        timesheetSpend: timesheets.totalSpend,
        expenseSpend: expenses.totalAmount,
        totalSpend: timesheets.totalSpend + expenses.totalAmount,
        pmoBudget: resources.pmoBudget,
        pmoSpend: timesheets.pmoSpend,
        deliveryBudget: resources.deliveryBudget,
        deliverySpend: timesheets.deliverySpend,
        utilizationPercent: milestones.totalBudget > 0
          ? Math.round(((timesheets.totalSpend + expenses.totalAmount) / milestones.totalBudget) * 100)
          : 0
      };

      // Combine milestone spend from timesheets and expenses
      const milestoneSpend = { ...timesheets.spendByMilestone };
      Object.entries(expenses.byMilestone).forEach(([milestoneId, amount]) => {
        milestoneSpend[milestoneId] = (milestoneSpend[milestoneId] || 0) + amount;
      });

      return {
        milestones,
        deliverables,
        kpis,
        qualityStandards,
        timesheets,
        expenses,
        resources,
        certificates,
        budget,
        milestoneSpend,
        projectProgress: milestones.averageProgress,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('MetricsService.getAllDashboardMetrics error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const metricsService = new MetricsService();
export default metricsService;
