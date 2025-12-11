/**
 * Report Data Fetcher Service
 * 
 * Central service for fetching data for report sections in the Report Builder Wizard.
 * Integrates with metricsService, raidService, and performs custom queries
 * for forward-looking sections.
 * 
 * The service:
 * - Calculates date ranges based on reporting period parameters
 * - Fetches and transforms data for each section type
 * - Applies filtering based on section configuration
 * - Handles role-based data restrictions
 * 
 * @version 1.0
 * @created 11 December 2025
 * @see docs/IMPLEMENTATION-Report-Builder-Wizard.md Segment 3
 */

import { supabase } from '../lib/supabase';
import { metricsService } from './metrics.service';
import { raidService } from './raid.service';
import { 
  SECTION_TYPE, 
  DATA_SOURCE,
  getSectionTypeConfig 
} from '../lib/reportSectionTypes';
import {
  REPORTING_PERIOD
} from './reportTemplates.service';
import {
  startOfMonth,
  endOfMonth,
  subMonths,
  subQuarters,
  startOfYear,
  addDays,
  addMonths,
  addWeeks,
  format,
  parseISO,
  isWithinInterval,
  isBefore,
  isAfter
} from 'date-fns';

// ============================================
// DATE RANGE UTILITIES
// ============================================

/**
 * Calculate date range based on reporting period selection
 * @param {string} periodFilter - Reporting period identifier
 * @param {Object} customRange - Custom date range { startDate, endDate }
 * @returns {{ startDate: Date, endDate: Date, label: string }}
 */
export function getDateRange(periodFilter, customRange = {}) {
  const now = new Date();
  let startDate, endDate, label;

  switch (periodFilter) {
    case REPORTING_PERIOD.LAST_MONTH:
    case 'lastMonth':
      startDate = startOfMonth(subMonths(now, 1));
      endDate = endOfMonth(subMonths(now, 1));
      label = format(startDate, 'MMMM yyyy');
      break;

    case REPORTING_PERIOD.LAST_QUARTER:
    case 'lastQuarter':
      endDate = endOfMonth(subMonths(now, 1));
      startDate = startOfMonth(subMonths(now, 3));
      label = `${format(startDate, 'MMM yyyy')} - ${format(endDate, 'MMM yyyy')}`;
      break;

    case REPORTING_PERIOD.LAST_6_MONTHS:
    case 'last6Months':
      endDate = endOfMonth(subMonths(now, 1));
      startDate = startOfMonth(subMonths(now, 6));
      label = `${format(startDate, 'MMM yyyy')} - ${format(endDate, 'MMM yyyy')}`;
      break;

    case REPORTING_PERIOD.YEAR_TO_DATE:
    case 'yearToDate':
      startDate = startOfYear(now);
      endDate = now;
      label = `${format(startDate, 'MMM yyyy')} - ${format(endDate, 'MMM yyyy')}`;
      break;

    case REPORTING_PERIOD.CUSTOM:
    case 'custom':
      if (customRange.startDate && customRange.endDate) {
        startDate = typeof customRange.startDate === 'string' 
          ? parseISO(customRange.startDate) 
          : customRange.startDate;
        endDate = typeof customRange.endDate === 'string'
          ? parseISO(customRange.endDate)
          : customRange.endDate;
        label = `${format(startDate, 'dd MMM yyyy')} - ${format(endDate, 'dd MMM yyyy')}`;
      } else {
        // Default to last month if custom range not provided
        startDate = startOfMonth(subMonths(now, 1));
        endDate = endOfMonth(subMonths(now, 1));
        label = format(startDate, 'MMMM yyyy');
      }
      break;

    default:
      // Default to last month
      startDate = startOfMonth(subMonths(now, 1));
      endDate = endOfMonth(subMonths(now, 1));
      label = format(startDate, 'MMMM yyyy');
  }

  return { startDate, endDate, label };
}

/**
 * Calculate look-ahead date range for forward-looking sections
 * @param {string} lookAheadPeriod - Look-ahead period identifier
 * @returns {{ startDate: Date, endDate: Date, label: string }}
 */
export function getLookAheadRange(lookAheadPeriod) {
  const now = new Date();
  const startDate = now;
  let endDate, label;

  switch (lookAheadPeriod) {
    case '1week':
      endDate = addDays(now, 7);
      label = 'Next Week';
      break;

    case '2weeks':
      endDate = addWeeks(now, 2);
      label = 'Next 2 Weeks';
      break;

    case '1month':
      endDate = addMonths(now, 1);
      label = 'Next Month';
      break;

    case '3months':
      endDate = addMonths(now, 3);
      label = 'Next 3 Months';
      break;

    case '6months':
      endDate = addMonths(now, 6);
      label = 'Next 6 Months';
      break;

    default:
      endDate = addMonths(now, 3);
      label = 'Next 3 Months';
  }

  return { startDate, endDate, label };
}

// ============================================
// REPORT DATA FETCHER SERVICE
// ============================================

class ReportDataFetcherService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 second cache for report data
  }

  /**
   * Clear all cached data
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

  // ─────────────────────────────────────────────────────────────
  // MAIN ENTRY POINT
  // ─────────────────────────────────────────────────────────────

  /**
   * Fetch data for a specific report section
   * Main entry point for the Report Builder
   * 
   * @param {string} sectionType - Section type identifier
   * @param {Object} config - Section configuration
   * @param {Object} context - Report context
   * @param {string} context.projectId - Project UUID
   * @param {string} context.reportingPeriod - Reporting period
   * @param {Object} context.customDateRange - Custom date range (if applicable)
   * @param {string} context.userRole - User's role for data restrictions
   * @returns {Promise<Object>} Section data
   */
  async fetchSectionData(sectionType, config, context) {
    const sectionConfig = getSectionTypeConfig(sectionType);
    if (!sectionConfig) {
      throw new Error(`Unknown section type: ${sectionType}`);
    }

    // Check role restrictions
    if (sectionConfig.roleRestriction) {
      if (!sectionConfig.roleRestriction.includes(context.userRole)) {
        return {
          restricted: true,
          message: 'You do not have permission to view this section'
        };
      }
    }

    // Calculate date range
    const dateRange = getDateRange(context.reportingPeriod, context.customDateRange);

    // Route to appropriate fetcher based on data source
    switch (sectionConfig.dataSource) {
      case DATA_SOURCE.METRICS_SERVICE:
        return this.fetchMetricsData(sectionType, config, context, dateRange);

      case DATA_SOURCE.RAID_SERVICE:
        return this.fetchRAIDData(config, context, dateRange);

      case DATA_SOURCE.CUSTOM_QUERY:
        return this.fetchCustomData(sectionType, config, context, dateRange);

      case DATA_SOURCE.USER_INPUT:
      case DATA_SOURCE.AI_GENERATED:
        // These sections don't fetch data - content comes from config
        return {
          type: 'content',
          content: config.content || '',
          heading: config.heading || sectionConfig.name
        };

      default:
        throw new Error(`Unknown data source: ${sectionConfig.dataSource}`);
    }
  }

  /**
   * Fetch data for multiple sections in parallel
   * @param {Array} sections - Array of section objects with type and config
   * @param {Object} context - Report context
   * @returns {Promise<Map>} Map of section ID to data
   */
  async fetchAllSectionData(sections, context) {
    const results = new Map();
    
    // Fetch all section data in parallel
    const fetchPromises = sections.map(async (section) => {
      try {
        const data = await this.fetchSectionData(section.type, section.config, context);
        results.set(section.id, { success: true, data });
      } catch (error) {
        console.error(`Error fetching data for section ${section.id}:`, error);
        // Ensure we capture the error message properly
        const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
        results.set(section.id, { 
          success: false, 
          error: errorMessage,
          data: null
        });
      }
    });

    await Promise.all(fetchPromises);
    return results;
  }

  // ─────────────────────────────────────────────────────────────
  // METRICS SERVICE DATA FETCHERS
  // ─────────────────────────────────────────────────────────────

  /**
   * Route to appropriate metrics fetcher
   */
  async fetchMetricsData(sectionType, config, context, dateRange) {
    const { projectId } = context;

    switch (sectionType) {
      case SECTION_TYPE.MILESTONE_SUMMARY:
        return this.fetchMilestoneSummary(projectId, config, dateRange);

      case SECTION_TYPE.DELIVERABLE_SUMMARY:
        return this.fetchDeliverableSummary(projectId, config, dateRange);

      case SECTION_TYPE.KPI_PERFORMANCE:
        return this.fetchKPIPerformance(projectId, config, dateRange);

      case SECTION_TYPE.QUALITY_STANDARDS:
        return this.fetchQualityStandards(projectId, config, dateRange);

      case SECTION_TYPE.BUDGET_ANALYSIS:
        return this.fetchBudgetAnalysis(projectId, config, dateRange);

      case SECTION_TYPE.TIMESHEET_SUMMARY:
        return this.fetchTimesheetSummary(projectId, config, dateRange);

      case SECTION_TYPE.EXPENSE_SUMMARY:
        return this.fetchExpenseSummary(projectId, config, dateRange);

      case SECTION_TYPE.RESOURCE_SUMMARY:
        return this.fetchResourceSummary(projectId, config, dateRange);

      default:
        throw new Error(`No metrics handler for section type: ${sectionType}`);
    }
  }

  /**
   * Fetch milestone summary data
   */
  async fetchMilestoneSummary(projectId, config, dateRange) {
    try {
      const metrics = await metricsService.getMilestoneMetrics(projectId);
      
      // Filter milestones by status if specified
      let filteredMilestones = metrics.milestones;
      if (config.statusFilter && !config.statusFilter.includes('all')) {
        filteredMilestones = metrics.milestones.filter(m => 
          config.statusFilter.includes(m.status)
        );
      }

      // Sort milestones
      filteredMilestones = this.sortItems(filteredMilestones, config.sortBy, 'milestone_ref');

      return {
        type: SECTION_TYPE.MILESTONE_SUMMARY,
        dateRange,
        summary: {
          total: metrics.total,
          completed: metrics.completed,
          inProgress: metrics.inProgress,
          notStarted: metrics.notStarted,
          totalBudget: metrics.totalBudget,
          averageProgress: metrics.averageProgress
        },
        items: filteredMilestones.map(m => ({
          id: m.id,
          ref: m.milestone_ref,
          name: m.name,
          status: m.status,
          progress: m.progress || 0,
          budget: config.showBudget !== false ? (parseFloat(m.baseline_billable) || 0) : null,
          percentComplete: m.percent_complete || m.progress || 0
        })),
        config: {
          includeChart: config.includeChart !== false,
          showBudget: config.showBudget !== false,
          showProgress: config.showProgress !== false
        }
      };
    } catch (error) {
      console.error('fetchMilestoneSummary error:', error);
      throw error;
    }
  }

  /**
   * Fetch deliverable summary data
   */
  async fetchDeliverableSummary(projectId, config, dateRange) {
    try {
      const metrics = await metricsService.getDeliverableMetrics(projectId);
      
      // Filter deliverables by status
      let filteredDeliverables = metrics.deliverables;
      if (config.statusFilter && !config.statusFilter.includes('all')) {
        filteredDeliverables = metrics.deliverables.filter(d => 
          config.statusFilter.includes(d.status)
        );
      }

      // Sort deliverables
      filteredDeliverables = this.sortItems(filteredDeliverables, config.sortBy, 'deliverable_ref');

      // Group by milestone if requested
      let groupedData = null;
      if (config.groupByMilestone) {
        groupedData = this.groupByMilestone(filteredDeliverables);
      }

      // Identify overdue items
      const today = new Date().toISOString().split('T')[0];
      const overdueIds = new Set(
        filteredDeliverables
          .filter(d => d.due_date < today && d.status !== 'Delivered')
          .map(d => d.id)
      );

      return {
        type: SECTION_TYPE.DELIVERABLE_SUMMARY,
        dateRange,
        summary: {
          total: metrics.total,
          delivered: metrics.delivered,
          inProgress: metrics.inProgress,
          notStarted: metrics.notStarted,
          overdue: metrics.overdue,
          completionPercent: metrics.completionPercent
        },
        items: filteredDeliverables.map(d => ({
          id: d.id,
          ref: d.deliverable_ref,
          name: d.name,
          status: d.status,
          dueDate: d.due_date,
          milestoneId: d.milestone_id,
          isOverdue: config.highlightOverdue !== false && overdueIds.has(d.id)
        })),
        groupedByMilestone: groupedData,
        config: {
          includeChart: config.includeChart !== false,
          groupByMilestone: config.groupByMilestone || false,
          highlightOverdue: config.highlightOverdue !== false
        }
      };
    } catch (error) {
      console.error('fetchDeliverableSummary error:', error);
      throw error;
    }
  }

  /**
   * Fetch KPI performance data
   */
  async fetchKPIPerformance(projectId, config, dateRange) {
    try {
      const metrics = await metricsService.getKPIMetrics(projectId);
      
      // Sort KPIs
      let sortedKPIs = this.sortItems(metrics.kpis, config.sortBy, 'kpi_ref');

      // Group by category if requested
      let groupedData = null;
      if (config.groupByCategory !== false) {
        groupedData = metrics.byCategory;
      }

      return {
        type: SECTION_TYPE.KPI_PERFORMANCE,
        dateRange,
        summary: {
          total: metrics.total,
          achieved: metrics.achieved,
          atRisk: metrics.atRisk,
          failing: metrics.failing,
          achievementPercent: metrics.achievementPercent
        },
        items: sortedKPIs.map(k => ({
          id: k.id,
          ref: k.kpi_ref,
          name: k.name,
          category: k.category,
          target: config.includeTarget !== false ? k.target : null,
          actual: k.calculatedValue,
          ragStatus: config.showRAG !== false ? k.ragStatus : null,
          assessmentCount: k.assessmentCount,
          isAchieved: k.isAchieved
        })),
        byCategory: groupedData,
        config: {
          includeChart: config.includeChart !== false,
          showRAG: config.showRAG !== false,
          includeTarget: config.includeTarget !== false,
          groupByCategory: config.groupByCategory !== false
        }
      };
    } catch (error) {
      console.error('fetchKPIPerformance error:', error);
      throw error;
    }
  }

  /**
   * Fetch quality standards data
   */
  async fetchQualityStandards(projectId, config, dateRange) {
    try {
      const metrics = await metricsService.getQualityStandardMetrics(projectId);
      
      // Sort quality standards
      let sortedQS = this.sortItems(metrics.qualityStandards, config.sortBy, 'qs_ref');

      return {
        type: SECTION_TYPE.QUALITY_STANDARDS,
        dateRange,
        summary: {
          total: metrics.total,
          achieved: metrics.achieved,
          partial: metrics.partial,
          notMet: metrics.notMet,
          achievementPercent: metrics.achievementPercent
        },
        items: sortedQS.map(q => ({
          id: q.id,
          ref: q.qs_ref,
          name: q.name,
          target: q.target,
          actual: q.calculatedValue,
          assessmentCount: config.showAssessmentCount !== false ? q.assessmentCount : null,
          assessmentsMet: q.assessmentsMet,
          isAchieved: q.isAchieved
        })),
        config: {
          includeChart: config.includeChart !== false,
          showAssessmentCount: config.showAssessmentCount !== false
        }
      };
    } catch (error) {
      console.error('fetchQualityStandards error:', error);
      throw error;
    }
  }

  /**
   * Fetch budget analysis data
   */
  async fetchBudgetAnalysis(projectId, config, dateRange) {
    try {
      const metrics = await metricsService.getAllDashboardMetrics(projectId);
      
      // Build milestone spend breakdown with baseline_billable as budget
      let milestoneSpend = [];
      if (config.showByMilestone !== false) {
        const milestoneData = metrics.milestones.milestones || [];
        milestoneSpend = milestoneData.map(m => ({
          id: m.id,
          ref: m.milestone_ref,
          name: m.name,
          budget: parseFloat(m.baseline_billable) || 0, // Committed baseline value
          spend: metrics.milestoneSpend?.[m.id] || 0,
          variance: (parseFloat(m.baseline_billable) || 0) - (metrics.milestoneSpend?.[m.id] || 0)
        }));
      }

      return {
        type: SECTION_TYPE.BUDGET_ANALYSIS,
        dateRange,
        summary: {
          totalBudget: metrics.budget.totalBudget,
          totalSpend: metrics.budget.totalSpend,
          variance: metrics.budget.totalBudget - metrics.budget.totalSpend,
          utilizationPercent: metrics.budget.utilizationPercent,
          timesheetSpend: metrics.budget.timesheetSpend,
          expenseSpend: metrics.budget.expenseSpend
        },
        pmoVsDelivery: config.showPMOvsDelivery !== false ? {
          pmo: {
            budget: metrics.budget.pmoBudget,
            spend: metrics.budget.pmoSpend,
            variance: metrics.budget.pmoBudget - metrics.budget.pmoSpend
          },
          delivery: {
            budget: metrics.budget.deliveryBudget,
            spend: metrics.budget.deliverySpend,
            variance: metrics.budget.deliveryBudget - metrics.budget.deliverySpend
          }
        } : null,
        byMilestone: milestoneSpend,
        config: {
          includeChart: config.includeChart !== false,
          showPMOvsDelivery: config.showPMOvsDelivery !== false,
          showByMilestone: config.showByMilestone !== false,
          showVariance: config.showVariance !== false
        }
      };
    } catch (error) {
      console.error('fetchBudgetAnalysis error:', error);
      throw error;
    }
  }

  /**
   * Fetch timesheet summary data
   */
  async fetchTimesheetSummary(projectId, config, dateRange) {
    try {
      const metrics = await metricsService.getTimesheetMetrics(projectId);
      
      // Build resource breakdown
      let byResource = [];
      if (config.showByResource !== false) {
        byResource = Object.entries(metrics.spendByResource || {}).map(([resourceId, spend]) => ({
          resourceId,
          spend
        }));
      }

      // Build milestone breakdown
      let byMilestone = [];
      if (config.showByMilestone !== false) {
        byMilestone = Object.entries(metrics.spendByMilestone || {}).map(([milestoneId, spend]) => ({
          milestoneId,
          spend
        }));
      }

      return {
        type: SECTION_TYPE.TIMESHEET_SUMMARY,
        dateRange,
        summary: {
          totalEntries: metrics.totalEntries,
          validEntries: metrics.validEntries,
          draftEntries: metrics.draftEntries,
          totalHours: metrics.totalHours,
          totalSpend: metrics.totalSpend,
          pmoSpend: metrics.pmoSpend,
          deliverySpend: metrics.deliverySpend
        },
        byResource,
        byMilestone,
        config: {
          includeChart: config.includeChart !== false,
          showByResource: config.showByResource !== false,
          showByMilestone: config.showByMilestone !== false
        }
      };
    } catch (error) {
      console.error('fetchTimesheetSummary error:', error);
      throw error;
    }
  }

  /**
   * Fetch expense summary data
   */
  async fetchExpenseSummary(projectId, config, dateRange) {
    try {
      const metrics = await metricsService.getExpenseMetrics(projectId);

      // Build category breakdown
      let byCategory = [];
      if (config.showByCategory !== false) {
        byCategory = Object.entries(metrics.byCategory || {}).map(([category, amount]) => ({
          category,
          amount
        })).sort((a, b) => b.amount - a.amount);
      }

      return {
        type: SECTION_TYPE.EXPENSE_SUMMARY,
        dateRange,
        summary: {
          totalEntries: metrics.totalEntries,
          validEntries: metrics.validEntries,
          draftEntries: metrics.draftEntries,
          totalAmount: metrics.totalAmount,
          chargeableAmount: metrics.chargeableAmount,
          nonChargeableAmount: metrics.nonChargeableAmount
        },
        byCategory,
        chargeableBreakdown: config.showChargeableBreakdown !== false ? {
          chargeable: metrics.chargeableAmount,
          nonChargeable: metrics.nonChargeableAmount
        } : null,
        config: {
          includeChart: config.includeChart !== false,
          showByCategory: config.showByCategory !== false,
          showChargeableBreakdown: config.showChargeableBreakdown !== false
        }
      };
    } catch (error) {
      console.error('fetchExpenseSummary error:', error);
      throw error;
    }
  }

  /**
   * Fetch resource summary data
   */
  async fetchResourceSummary(projectId, config, dateRange) {
    try {
      const metrics = await metricsService.getResourceMetrics(projectId);

      // Group by role if requested
      let byRole = null;
      if (config.groupByRole !== false) {
        byRole = {};
        metrics.resources.forEach(r => {
          const role = r.role || 'Unassigned';
          if (!byRole[role]) {
            byRole[role] = [];
          }
          byRole[role].push(r);
        });
      }

      return {
        type: SECTION_TYPE.RESOURCE_SUMMARY,
        dateRange,
        summary: {
          total: metrics.total,
          pmoCount: metrics.pmoCount,
          deliveryCount: metrics.deliveryCount,
          totalBudget: metrics.totalBudget,
          pmoBudget: metrics.pmoBudget,
          deliveryBudget: metrics.deliveryBudget
        },
        items: metrics.resources.map(r => ({
          id: r.id,
          name: r.name,
          role: r.role,
          daysAllocated: config.showAllocation !== false ? r.days_allocated : null,
          sellPrice: r.sell_price,
          budget: (r.sell_price || 0) * (r.days_allocated || 0)
        })),
        byRole,
        config: {
          includeChart: config.includeChart !== false,
          showAllocation: config.showAllocation !== false,
          showUtilisation: config.showUtilisation !== false,
          groupByRole: config.groupByRole !== false
        }
      };
    } catch (error) {
      console.error('fetchResourceSummary error:', error);
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // RAID SERVICE DATA FETCHERS
  // ─────────────────────────────────────────────────────────────

  /**
   * Fetch RAID summary data
   */
  async fetchRAIDData(config, context, dateRange) {
    try {
      const { projectId } = context;
      
      // Build query options from config
      const queryOptions = {};
      
      // Category filter
      if (config.categories && config.categories.length > 0 && !config.categories.includes('all')) {
        // We'll filter client-side since raidService.getAllWithRelations
        // doesn't support multi-category filtering
      }
      
      // Status filter
      if (config.statusFilter && config.statusFilter.length > 0) {
        queryOptions.status = config.statusFilter;
      }

      // Severity filter
      if (config.severityFilter && config.severityFilter.length > 0 && !config.severityFilter.includes('all')) {
        // Filter client-side
      }

      // Fetch items with relations
      let items = await raidService.getAllWithRelations(projectId, queryOptions);

      // Apply category filter if specified
      if (config.categories && config.categories.length > 0 && !config.categories.includes('all')) {
        items = items.filter(item => config.categories.includes(item.category));
      }

      // Apply severity filter if specified
      if (config.severityFilter && config.severityFilter.length > 0 && !config.severityFilter.includes('all')) {
        items = items.filter(item => config.severityFilter.includes(item.severity));
      }

      // Limit items if specified
      if (config.maxItems && config.maxItems > 0) {
        items = items.slice(0, config.maxItems);
      }

      // Get summary statistics
      const summary = await raidService.getSummary(projectId);

      // Group items by category
      const byCategory = {
        Risk: items.filter(i => i.category === 'Risk'),
        Assumption: items.filter(i => i.category === 'Assumption'),
        Issue: items.filter(i => i.category === 'Issue'),
        Dependency: items.filter(i => i.category === 'Dependency')
      };

      return {
        type: SECTION_TYPE.RAID_SUMMARY,
        dateRange,
        summary: {
          total: summary.total,
          byCategory: summary.byCategory,
          byStatus: summary.byStatus,
          bySeverity: summary.bySeverity,
          highPriorityCount: summary.highPriorityItems.length
        },
        items: items.map(item => ({
          id: item.id,
          ref: item.raid_ref,
          category: item.category,
          title: item.title,
          description: config.showDetails !== false ? item.description : null,
          status: item.status,
          severity: item.severity,
          owner: item.owner ? {
            id: item.owner.id,
            name: item.owner.name
          } : null,
          dueDate: item.due_date,
          milestone: item.milestone ? {
            id: item.milestone.id,
            ref: item.milestone.milestone_ref,
            name: item.milestone.name
          } : null
        })),
        byCategory,
        highPriorityItems: summary.highPriorityItems,
        config: {
          includeChart: config.includeChart !== false,
          showDetails: config.showDetails !== false,
          categories: config.categories || ['Risk', 'Assumption', 'Issue', 'Dependency'],
          maxItems: config.maxItems || 0
        }
      };
    } catch (error) {
      console.error('fetchRAIDData error:', error);
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // CUSTOM QUERY DATA FETCHERS (Forward-Looking)
  // ─────────────────────────────────────────────────────────────

  /**
   * Route to appropriate custom fetcher
   */
  async fetchCustomData(sectionType, config, context, dateRange) {
    switch (sectionType) {
      case SECTION_TYPE.FORWARD_LOOK:
        return this.fetchForwardLook(config, context);

      case SECTION_TYPE.UPCOMING_MILESTONES:
        return this.fetchUpcomingMilestones(config, context);

      case SECTION_TYPE.UPCOMING_DELIVERABLES:
        return this.fetchUpcomingDeliverables(config, context);

      default:
        throw new Error(`No custom handler for section type: ${sectionType}`);
    }
  }

  /**
   * Fetch combined forward-looking data
   */
  async fetchForwardLook(config, context) {
    try {
      const { projectId } = context;
      const lookAhead = getLookAheadRange(config.lookAheadPeriod || '3months');
      const today = new Date().toISOString().split('T')[0];
      const endDateStr = lookAhead.endDate.toISOString().split('T')[0];

      const result = {
        type: SECTION_TYPE.FORWARD_LOOK,
        lookAheadRange: lookAhead,
        milestones: [],
        deliverables: [],
        dependencies: [],
        resources: []
      };

      // Fetch upcoming milestones
      if (config.includeMilestones !== false) {
        const { data: milestones, error: mError } = await supabase
          .from('milestones')
          .select('id, milestone_ref, name, status, end_date, progress, baseline_billable')
          .eq('project_id', projectId)
          .eq('is_deleted', false)
          .neq('status', 'Completed')
          .gte('end_date', today)
          .lte('end_date', endDateStr)
          .order('end_date', { ascending: true });

        if (mError) {
          console.error('Forward look milestones query error:', mError);
        } else {
          result.milestones = milestones || [];
        }
      }

      // Fetch upcoming deliverables
      if (config.includeDeliverables !== false) {
        const { data: deliverables, error: dError } = await supabase
          .from('deliverables')
          .select('id, deliverable_ref, name, status, due_date, milestone_id')
          .eq('project_id', projectId)
          .eq('is_deleted', false)
          .neq('status', 'Delivered')
          .gte('due_date', today)
          .lte('due_date', endDateStr)
          .order('due_date', { ascending: true });

        if (dError) {
          console.error('Forward look deliverables query error:', dError);
        } else {
          result.deliverables = deliverables || [];
        }
      }

      // Fetch blocking dependencies (open RAID items of type Dependency)
      if (config.includeDependencies !== false) {
        const { data: dependencies, error: depError } = await supabase
          .from('raid_items')
          .select(`
            id, raid_ref, title, description, status, severity, due_date,
            owner:resources!raid_items_owner_id_fkey(id, name),
            milestone:milestones!raid_items_milestone_id_fkey(id, name, milestone_ref)
          `)
          .eq('project_id', projectId)
          .eq('category', 'Dependency')
          .eq('is_deleted', false)
          .in('status', ['Open', 'In Progress'])
          .order('severity', { ascending: false });

        if (depError) {
          console.error('Forward look dependencies query error:', depError);
        } else {
          result.dependencies = dependencies || [];
        }
      }

      // Resource requirements (future enhancement - placeholder)
      if (config.includeResources) {
        result.resources = []; // TODO: Implement resource forecasting
      }

      return {
        ...result,
        summary: {
          milestonesCount: result.milestones.length,
          deliverablesCount: result.deliverables.length,
          dependenciesCount: result.dependencies.length,
          highPriorityDependencies: result.dependencies.filter(d => d.severity === 'High').length
        },
        config: {
          lookAheadPeriod: config.lookAheadPeriod || '3months',
          includeMilestones: config.includeMilestones !== false,
          includeDeliverables: config.includeDeliverables !== false,
          includeDependencies: config.includeDependencies !== false,
          includeResources: config.includeResources || false
        }
      };
    } catch (error) {
      console.error('fetchForwardLook error:', error);
      throw error;
    }
  }

  /**
   * Fetch upcoming milestones only
   */
  async fetchUpcomingMilestones(config, context) {
    try {
      const { projectId } = context;
      const lookAhead = getLookAheadRange(config.lookAheadPeriod || '3months');
      const today = new Date().toISOString().split('T')[0];
      const endDateStr = lookAhead.endDate.toISOString().split('T')[0];

      // Build status filter
      const statusFilter = ['Not Started'];
      if (config.includeInProgress !== false) {
        statusFilter.push('In Progress');
      }

      const { data: milestones, error } = await supabase
        .from('milestones')
        .select('id, milestone_ref, name, status, end_date, progress, baseline_billable')
        .eq('project_id', projectId)
        .eq('is_deleted', false)
        .in('status', statusFilter)
        .lte('end_date', endDateStr)
        .order('end_date', { ascending: true });

      if (error) throw error;

      // Fetch dependencies if requested
      let dependencies = [];
      if (config.showDependencies) {
        const milestoneIds = milestones?.map(m => m.id) || [];
        if (milestoneIds.length > 0) {
          const { data: deps, error: depError } = await supabase
            .from('raid_items')
            .select('id, raid_ref, title, milestone_id, status, severity')
            .eq('category', 'Dependency')
            .eq('is_deleted', false)
            .in('milestone_id', milestoneIds)
            .in('status', ['Open', 'In Progress']);

          if (!depError && deps) {
            dependencies = deps;
          }
        }
      }

      // Attach dependencies to milestones
      const milestonesWithDeps = (milestones || []).map(m => ({
        ...m,
        dependencies: dependencies.filter(d => d.milestone_id === m.id)
      }));

      return {
        type: SECTION_TYPE.UPCOMING_MILESTONES,
        lookAheadRange: lookAhead,
        items: milestonesWithDeps,
        summary: {
          total: milestonesWithDeps.length,
          notStarted: milestonesWithDeps.filter(m => m.status === 'Not Started').length,
          inProgress: milestonesWithDeps.filter(m => m.status === 'In Progress').length,
          withBlockingDeps: milestonesWithDeps.filter(m => m.dependencies.length > 0).length
        },
        config: {
          lookAheadPeriod: config.lookAheadPeriod || '3months',
          includeInProgress: config.includeInProgress !== false,
          showDependencies: config.showDependencies || false
        }
      };
    } catch (error) {
      console.error('fetchUpcomingMilestones error:', error);
      throw error;
    }
  }

  /**
   * Fetch upcoming deliverables only
   */
  async fetchUpcomingDeliverables(config, context) {
    try {
      const { projectId } = context;
      const lookAhead = getLookAheadRange(config.lookAheadPeriod || '1month');
      const today = new Date().toISOString().split('T')[0];
      const endDateStr = lookAhead.endDate.toISOString().split('T')[0];

      const { data: deliverables, error } = await supabase
        .from('deliverables')
        .select(`
          id, deliverable_ref, name, status, due_date, milestone_id,
          milestone:milestones!deliverables_milestone_id_fkey(id, name, milestone_ref)
        `)
        .eq('project_id', projectId)
        .eq('is_deleted', false)
        .neq('status', 'Delivered')
        .lte('due_date', endDateStr)
        .order('due_date', { ascending: true });

      if (error) throw error;

      // Identify overdue
      const overdueIds = new Set(
        (deliverables || [])
          .filter(d => d.due_date < today)
          .map(d => d.id)
      );

      // Group by milestone if requested
      let groupedByMilestone = null;
      if (config.groupByMilestone !== false) {
        groupedByMilestone = {};
        (deliverables || []).forEach(d => {
          const key = d.milestone?.milestone_ref || 'Unassigned';
          if (!groupedByMilestone[key]) {
            groupedByMilestone[key] = {
              milestone: d.milestone,
              deliverables: []
            };
          }
          groupedByMilestone[key].deliverables.push(d);
        });
      }

      return {
        type: SECTION_TYPE.UPCOMING_DELIVERABLES,
        lookAheadRange: lookAhead,
        items: (deliverables || []).map(d => ({
          ...d,
          isOverdue: config.highlightOverdue !== false && overdueIds.has(d.id)
        })),
        groupedByMilestone,
        summary: {
          total: (deliverables || []).length,
          overdue: overdueIds.size,
          dueThisWeek: (deliverables || []).filter(d => {
            const dueDate = d.due_date;
            const weekFromNow = new Date();
            weekFromNow.setDate(weekFromNow.getDate() + 7);
            return dueDate >= today && dueDate <= weekFromNow.toISOString().split('T')[0];
          }).length
        },
        config: {
          lookAheadPeriod: config.lookAheadPeriod || '1month',
          groupByMilestone: config.groupByMilestone !== false,
          highlightOverdue: config.highlightOverdue !== false
        }
      };
    } catch (error) {
      console.error('fetchUpcomingDeliverables error:', error);
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // HELPER METHODS
  // ─────────────────────────────────────────────────────────────

  /**
   * Sort items by specified field
   */
  sortItems(items, sortBy, defaultSort = 'id') {
    const sortField = sortBy || defaultSort;
    
    return [...items].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      // Handle null/undefined
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // Handle numbers
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return aVal - bVal;
      }

      // Handle strings
      return String(aVal).localeCompare(String(bVal));
    });
  }

  /**
   * Group deliverables by milestone
   */
  groupByMilestone(deliverables) {
    const grouped = {};
    
    deliverables.forEach(d => {
      const key = d.milestone_id || 'unassigned';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(d);
    });

    return grouped;
  }

  /**
   * Filter items by date range
   */
  filterByDateRange(items, dateField, startDate, endDate) {
    return items.filter(item => {
      const itemDate = item[dateField];
      if (!itemDate) return true; // Include items without date

      const date = typeof itemDate === 'string' ? parseISO(itemDate) : itemDate;
      return isWithinInterval(date, { start: startDate, end: endDate });
    });
  }

  /**
   * Calculate period-over-period comparison
   * (For future enhancement)
   */
  calculatePeriodComparison(current, previous) {
    if (!previous || previous === 0) {
      return { change: null, percentChange: null };
    }

    const change = current - previous;
    const percentChange = Math.round((change / previous) * 100);

    return { change, percentChange };
  }
}

// Export singleton instance
export const reportDataFetcherService = new ReportDataFetcherService();
export default reportDataFetcherService;
