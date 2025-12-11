/**
 * Report Renderer Service
 * 
 * Renders report sections to HTML for the Report Builder Wizard.
 * Takes data from reportDataFetcher.service.js and produces
 * print-ready HTML output.
 * 
 * Features:
 * - Renders all 15 section types to HTML
 * - Generates simple charts as inline SVG
 * - Includes print-optimized CSS styles
 * - Supports customization via section config
 * 
 * @version 1.0
 * @created 11 December 2025
 * @see docs/IMPLEMENTATION-Report-Builder-Wizard.md Segment 4
 */

import { 
  SECTION_TYPE, 
  getSectionTypeConfig 
} from '../lib/reportSectionTypes';
import { format } from 'date-fns';

// ============================================
// CHART COLORS
// ============================================

const CHART_COLORS = {
  primary: '#3B82F6',    // Blue
  success: '#22C55E',    // Green
  warning: '#F59E0B',    // Amber
  danger: '#EF4444',     // Red
  neutral: '#6B7280',    // Gray
  purple: '#8B5CF6',
  cyan: '#06B6D4',
  pink: '#EC4899',
  indigo: '#6366F1',
  teal: '#14B8A6'
};

const STATUS_COLORS = {
  // Milestone/Deliverable statuses
  'Completed': CHART_COLORS.success,
  'Delivered': CHART_COLORS.success,
  'In Progress': CHART_COLORS.primary,
  'In Review': CHART_COLORS.warning,
  'Submitted': CHART_COLORS.warning,
  'Not Started': CHART_COLORS.neutral,
  'Draft': CHART_COLORS.neutral,
  'On Hold': CHART_COLORS.warning,
  
  // RAG statuses
  'Green': CHART_COLORS.success,
  'Amber': CHART_COLORS.warning,
  'Red': CHART_COLORS.danger,
  
  // RAID statuses
  'Open': CHART_COLORS.danger,
  'Closed': CHART_COLORS.success,
  'Mitigated': CHART_COLORS.success,
  'Accepted': CHART_COLORS.primary,
  
  // Severity
  'High': CHART_COLORS.danger,
  'Medium': CHART_COLORS.warning,
  'Low': CHART_COLORS.success
};

// ============================================
// REPORT RENDERER SERVICE
// ============================================

export class ReportRendererService {
  constructor() {
    this.defaultStyles = this.getDefaultStyles();
  }

  // ─────────────────────────────────────────────────────────────
  // MAIN RENDER METHODS
  // ─────────────────────────────────────────────────────────────

  /**
   * Render a complete report from template and section data
   * @param {Object} template - Report template with metadata and sections
   * @param {Map} sectionData - Map of section ID to fetched data
   * @param {Object} context - Report context (project, user, etc.)
   * @returns {{ html: string, warnings: string[] }}
   */
  renderReport(template, sectionData, context) {
    const warnings = [];
    const sections = template.template_definition?.sections || [];
    
    // Build report context
    const reportContext = this.buildReportContext(template, context);

    // Render cover page if enabled
    let coverHtml = '';
    if (template.template_definition?.metadata?.includeCoverPage !== false) {
      coverHtml = this.renderCoverPage(template, reportContext);
    }

    // Render table of contents if enabled
    let tocHtml = '';
    if (template.template_definition?.metadata?.includeTableOfContents) {
      tocHtml = this.renderTableOfContents(sections, sectionData);
    }

    // Render each section
    const sectionsHtml = sections.map((section, index) => {
      try {
        const data = sectionData.get(section.id);
        if (!data) {
          warnings.push(`Section ${index + 1} (${section.type}): No data available`);
          return this.renderEmptySection(section);
        }
        if (!data.success) {
          warnings.push(`Section ${index + 1} (${section.type}): ${data.error}`);
          return this.renderErrorSection(section, data.error);
        }
        if (data.data?.restricted) {
          return this.renderRestrictedSection(section, data.data.message);
        }
        return this.renderSection(section, data.data, reportContext);
      } catch (error) {
        warnings.push(`Section ${index + 1} (${section.type}): ${error.message}`);
        return this.renderErrorSection(section, error.message);
      }
    }).join('\n');

    // Wrap in full HTML document
    const html = this.wrapDocument(
      coverHtml + tocHtml + sectionsHtml,
      template,
      reportContext
    );

    return { html, warnings };
  }

  /**
   * Render a single section to HTML
   * @param {Object} section - Section definition with type and config
   * @param {Object} data - Fetched data for this section
   * @param {Object} context - Report context
   * @returns {string} HTML string
   */
  renderSection(section, data, context) {
    const sectionConfig = getSectionTypeConfig(section.type);
    if (!sectionConfig) {
      return `<!-- Unknown section type: ${section.type} -->`;
    }

    // Route to appropriate renderer
    switch (section.type) {
      // Backward-looking sections
      case SECTION_TYPE.MILESTONE_SUMMARY:
        return this.renderMilestoneSummary(section, data, context);
      case SECTION_TYPE.DELIVERABLE_SUMMARY:
        return this.renderDeliverableSummary(section, data, context);
      case SECTION_TYPE.KPI_PERFORMANCE:
        return this.renderKPIPerformance(section, data, context);
      case SECTION_TYPE.QUALITY_STANDARDS:
        return this.renderQualityStandards(section, data, context);
      case SECTION_TYPE.BUDGET_ANALYSIS:
        return this.renderBudgetAnalysis(section, data, context);
      case SECTION_TYPE.RAID_SUMMARY:
        return this.renderRAIDSummary(section, data, context);
      case SECTION_TYPE.TIMESHEET_SUMMARY:
        return this.renderTimesheetSummary(section, data, context);
      case SECTION_TYPE.EXPENSE_SUMMARY:
        return this.renderExpenseSummary(section, data, context);
      
      // Forward-looking sections
      case SECTION_TYPE.FORWARD_LOOK:
        return this.renderForwardLook(section, data, context);
      case SECTION_TYPE.UPCOMING_MILESTONES:
        return this.renderUpcomingMilestones(section, data, context);
      case SECTION_TYPE.UPCOMING_DELIVERABLES:
        return this.renderUpcomingDeliverables(section, data, context);
      
      // Content sections
      case SECTION_TYPE.EXECUTIVE_SUMMARY:
        return this.renderExecutiveSummary(section, data, context);
      case SECTION_TYPE.LESSONS_LEARNED:
        return this.renderLessonsLearned(section, data, context);
      case SECTION_TYPE.CUSTOM_TEXT:
        return this.renderCustomText(section, data, context);
      case SECTION_TYPE.RESOURCE_SUMMARY:
        return this.renderResourceSummary(section, data, context);

      default:
        return `<!-- Unhandled section type: ${section.type} -->`;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // BACKWARD-LOOKING SECTION RENDERERS
  // ─────────────────────────────────────────────────────────────

  /**
   * Render milestone summary section
   */
  renderMilestoneSummary(section, data, context) {
    const { summary, items, config } = data;
    
    let html = this.renderSectionHeader('Milestone Summary', section, data.dateRange);

    // Summary cards
    html += this.renderSummaryCards([
      { label: 'Total', value: summary.total, color: 'neutral' },
      { label: 'Completed', value: summary.completed, color: 'success' },
      { label: 'In Progress', value: summary.inProgress, color: 'primary' },
      { label: 'Not Started', value: summary.notStarted, color: 'neutral' }
    ]);

    // Progress chart
    if (config.includeChart && items.length > 0) {
      html += this.renderDonutChart('Milestone Status', [
        { label: 'Completed', value: summary.completed, color: STATUS_COLORS['Completed'] },
        { label: 'In Progress', value: summary.inProgress, color: STATUS_COLORS['In Progress'] },
        { label: 'Not Started', value: summary.notStarted, color: STATUS_COLORS['Not Started'] }
      ]);
    }

    // Milestone table
    if (items.length > 0) {
      const columns = [
        { key: 'ref', header: 'Ref', width: '10%' },
        { key: 'name', header: 'Milestone', width: config.showBudget ? '40%' : '50%' },
        { key: 'status', header: 'Status', width: '15%', format: 'status' },
        { key: 'progress', header: 'Progress', width: config.showBudget ? '15%' : '25%', format: 'percent' }
      ];
      
      if (config.showBudget) {
        columns.push({ key: 'budget', header: 'Budget', width: '20%', format: 'currency' });
      }

      html += this.renderTable(items, columns);
    } else {
      html += this.renderEmptyMessage('No milestones found');
    }

    return this.wrapSection(html);
  }

  /**
   * Render deliverable summary section
   */
  renderDeliverableSummary(section, data, context) {
    const { summary, items, config } = data;
    
    let html = this.renderSectionHeader('Deliverable Summary', section, data.dateRange);

    // Summary cards
    html += this.renderSummaryCards([
      { label: 'Total', value: summary.total, color: 'neutral' },
      { label: 'Delivered', value: summary.delivered, color: 'success' },
      { label: 'In Progress', value: summary.inProgress, color: 'primary' },
      { label: 'Overdue', value: summary.overdue, color: 'danger' }
    ]);

    // Status chart
    if (config.includeChart && items.length > 0) {
      html += this.renderDonutChart('Deliverable Status', [
        { label: 'Delivered', value: summary.delivered, color: STATUS_COLORS['Delivered'] },
        { label: 'In Progress', value: summary.inProgress, color: STATUS_COLORS['In Progress'] },
        { label: 'Not Started', value: summary.notStarted, color: STATUS_COLORS['Not Started'] }
      ]);
    }

    // Deliverable table
    if (items.length > 0) {
      const tableItems = items.map(item => ({
        ...item,
        statusClass: item.isOverdue ? 'overdue' : ''
      }));

      html += this.renderTable(tableItems, [
        { key: 'ref', header: 'Ref', width: '10%' },
        { key: 'name', header: 'Deliverable', width: '45%' },
        { key: 'status', header: 'Status', width: '15%', format: 'status' },
        { key: 'dueDate', header: 'Due Date', width: '15%', format: 'date' }
      ], { highlightOverdue: config.highlightOverdue });
    } else {
      html += this.renderEmptyMessage('No deliverables found');
    }

    return this.wrapSection(html);
  }

  /**
   * Render KPI performance section
   */
  renderKPIPerformance(section, data, context) {
    const { summary, items, config, byCategory } = data;
    
    let html = this.renderSectionHeader('KPI Performance', section, data.dateRange);

    // Summary cards
    html += this.renderSummaryCards([
      { label: 'Total KPIs', value: summary.total, color: 'neutral' },
      { label: 'Achieved', value: summary.achieved, color: 'success' },
      { label: 'At Risk', value: summary.atRisk, color: 'warning' },
      { label: 'Below Target', value: summary.failing, color: 'danger' }
    ]);

    // RAG chart
    if (config.includeChart && items.length > 0) {
      html += this.renderDonutChart('KPI Achievement', [
        { label: 'Achieved', value: summary.achieved, color: STATUS_COLORS['Green'] },
        { label: 'At Risk', value: summary.atRisk, color: STATUS_COLORS['Amber'] },
        { label: 'Below Target', value: summary.failing, color: STATUS_COLORS['Red'] }
      ]);
    }

    // KPI table with RAG indicators
    if (items.length > 0) {
      const columns = [
        { key: 'ref', header: 'Ref', width: '10%' },
        { key: 'name', header: 'KPI', width: '35%' }
      ];

      if (config.includeTarget) {
        columns.push({ key: 'target', header: 'Target', width: '12%', format: 'percent' });
      }
      
      columns.push({ key: 'actual', header: 'Actual', width: '12%', format: 'percent' });
      
      if (config.showRAG) {
        columns.push({ key: 'ragStatus', header: 'RAG', width: '10%', format: 'rag' });
      }
      
      columns.push({ key: 'assessmentCount', header: 'Assessments', width: '12%' });

      html += this.renderTable(items, columns);
    } else {
      html += this.renderEmptyMessage('No KPIs defined');
    }

    return this.wrapSection(html);
  }

  /**
   * Render quality standards section
   */
  renderQualityStandards(section, data, context) {
    const { summary, items, config } = data;
    
    let html = this.renderSectionHeader('Quality Standards', section, data.dateRange);

    // Summary cards
    html += this.renderSummaryCards([
      { label: 'Total Standards', value: summary.total, color: 'neutral' },
      { label: 'Achieved', value: summary.achieved, color: 'success' },
      { label: 'Partial', value: summary.partial, color: 'warning' },
      { label: 'Not Met', value: summary.notMet, color: 'danger' }
    ]);

    // Compliance chart
    if (config.includeChart && items.length > 0) {
      html += this.renderDonutChart('Compliance Status', [
        { label: 'Achieved', value: summary.achieved, color: CHART_COLORS.success },
        { label: 'Partial', value: summary.partial, color: CHART_COLORS.warning },
        { label: 'Not Met', value: summary.notMet, color: CHART_COLORS.danger }
      ]);
    }

    // Standards table
    if (items.length > 0) {
      const columns = [
        { key: 'ref', header: 'Ref', width: '10%' },
        { key: 'name', header: 'Quality Standard', width: '40%' },
        { key: 'target', header: 'Target', width: '12%', format: 'percent' },
        { key: 'actual', header: 'Actual', width: '12%', format: 'percent' }
      ];

      if (config.showAssessmentCount) {
        columns.push({ key: 'assessmentCount', header: 'Assessments', width: '12%' });
      }

      html += this.renderTable(items, columns);
    } else {
      html += this.renderEmptyMessage('No quality standards defined');
    }

    return this.wrapSection(html);
  }

  /**
   * Render budget analysis section
   */
  renderBudgetAnalysis(section, data, context) {
    const { summary, pmoVsDelivery, byMilestone, config } = data;
    
    let html = this.renderSectionHeader('Budget Analysis', section, data.dateRange);

    // Main budget summary
    html += `
      <div class="budget-overview">
        <div class="budget-row">
          <div class="budget-item">
            <span class="budget-label">Total Budget</span>
            <span class="budget-value">${this.formatCurrency(summary.totalBudget)}</span>
          </div>
          <div class="budget-item">
            <span class="budget-label">Total Spend</span>
            <span class="budget-value">${this.formatCurrency(summary.totalSpend)}</span>
          </div>
          <div class="budget-item ${summary.variance >= 0 ? 'positive' : 'negative'}">
            <span class="budget-label">Variance</span>
            <span class="budget-value">${this.formatCurrency(summary.variance)}</span>
          </div>
          <div class="budget-item">
            <span class="budget-label">Utilisation</span>
            <span class="budget-value">${summary.utilizationPercent}%</span>
          </div>
        </div>
      </div>
    `;

    // Budget chart
    if (config.includeChart) {
      html += this.renderBarChart('Budget vs Spend', [
        { label: 'Budget', value: summary.totalBudget, color: CHART_COLORS.primary },
        { label: 'Spend', value: summary.totalSpend, color: CHART_COLORS.success }
      ]);
    }

    // PMO vs Delivery breakdown
    if (config.showPMOvsDelivery && pmoVsDelivery) {
      html += `
        <h4 class="subsection-title">PMO vs Delivery Split</h4>
        <div class="two-column">
          <div class="column">
            <h5>PMO</h5>
            <div class="mini-stats">
              <div>Budget: ${this.formatCurrency(pmoVsDelivery.pmo.budget)}</div>
              <div>Spend: ${this.formatCurrency(pmoVsDelivery.pmo.spend)}</div>
              <div class="${pmoVsDelivery.pmo.variance >= 0 ? 'positive' : 'negative'}">
                Variance: ${this.formatCurrency(pmoVsDelivery.pmo.variance)}
              </div>
            </div>
          </div>
          <div class="column">
            <h5>Delivery</h5>
            <div class="mini-stats">
              <div>Budget: ${this.formatCurrency(pmoVsDelivery.delivery.budget)}</div>
              <div>Spend: ${this.formatCurrency(pmoVsDelivery.delivery.spend)}</div>
              <div class="${pmoVsDelivery.delivery.variance >= 0 ? 'positive' : 'negative'}">
                Variance: ${this.formatCurrency(pmoVsDelivery.delivery.variance)}
              </div>
            </div>
          </div>
        </div>
      `;
    }

    // Spend by milestone
    if (config.showByMilestone && byMilestone && byMilestone.length > 0) {
      html += `<h4 class="subsection-title">Spend by Milestone</h4>`;
      html += this.renderTable(byMilestone, [
        { key: 'ref', header: 'Ref', width: '10%' },
        { key: 'name', header: 'Milestone', width: '40%' },
        { key: 'budget', header: 'Budget', width: '16%', format: 'currency' },
        { key: 'spend', header: 'Spend', width: '16%', format: 'currency' },
        { key: 'variance', header: 'Variance', width: '18%', format: 'currencyVariance' }
      ]);
    }

    return this.wrapSection(html);
  }

  /**
   * Render RAID summary section
   */
  renderRAIDSummary(section, data, context) {
    const { summary, items, byCategory, config } = data;
    
    let html = this.renderSectionHeader('RAID Summary', section, data.dateRange);

    // Summary by category
    html += this.renderSummaryCards([
      { label: 'Risks', value: `${summary.byCategory.Risk?.open || 0} open`, color: 'danger' },
      { label: 'Assumptions', value: `${summary.byCategory.Assumption?.open || 0} open`, color: 'warning' },
      { label: 'Issues', value: `${summary.byCategory.Issue?.open || 0} open`, color: 'danger' },
      { label: 'Dependencies', value: `${summary.byCategory.Dependency?.open || 0} open`, color: 'primary' }
    ]);

    // RAID chart
    if (config.includeChart) {
      html += this.renderDonutChart('RAID by Category', [
        { label: 'Risks', value: summary.byCategory.Risk?.total || 0, color: CHART_COLORS.danger },
        { label: 'Assumptions', value: summary.byCategory.Assumption?.total || 0, color: CHART_COLORS.warning },
        { label: 'Issues', value: summary.byCategory.Issue?.total || 0, color: CHART_COLORS.purple },
        { label: 'Dependencies', value: summary.byCategory.Dependency?.total || 0, color: CHART_COLORS.primary }
      ]);
    }

    // RAID items table
    if (items.length > 0) {
      const columns = [
        { key: 'ref', header: 'Ref', width: '8%' },
        { key: 'category', header: 'Category', width: '12%' },
        { key: 'title', header: 'Title', width: config.showDetails ? '30%' : '45%' },
        { key: 'severity', header: 'Severity', width: '10%', format: 'severity' },
        { key: 'status', header: 'Status', width: '10%', format: 'status' }
      ];

      if (config.showDetails) {
        // Show owner
        const itemsWithOwner = items.map(item => ({
          ...item,
          ownerName: item.owner?.name || '—'
        }));
        columns.push({ key: 'ownerName', header: 'Owner', width: '15%' });
        html += this.renderTable(itemsWithOwner, columns);
      } else {
        html += this.renderTable(items, columns);
      }
    } else {
      html += this.renderEmptyMessage('No RAID items found');
    }

    return this.wrapSection(html);
  }

  /**
   * Render timesheet summary section
   */
  renderTimesheetSummary(section, data, context) {
    const { summary, byResource, byMilestone, config } = data;
    
    let html = this.renderSectionHeader('Timesheet Summary', section, data.dateRange);

    // Summary cards
    html += this.renderSummaryCards([
      { label: 'Total Hours', value: this.formatNumber(summary.totalHours), color: 'primary' },
      { label: 'Total Spend', value: this.formatCurrency(summary.totalSpend), color: 'success' },
      { label: 'PMO Spend', value: this.formatCurrency(summary.pmoSpend), color: 'neutral' },
      { label: 'Delivery Spend', value: this.formatCurrency(summary.deliverySpend), color: 'neutral' }
    ]);

    // Hours chart
    if (config.includeChart) {
      html += this.renderBarChart('Spend Breakdown', [
        { label: 'PMO', value: summary.pmoSpend, color: CHART_COLORS.primary },
        { label: 'Delivery', value: summary.deliverySpend, color: CHART_COLORS.success }
      ]);
    }

    // Entry stats
    html += `
      <div class="stats-row">
        <span>Valid Entries: ${summary.validEntries}</span>
        <span>Draft Entries: ${summary.draftEntries}</span>
      </div>
    `;

    return this.wrapSection(html);
  }

  /**
   * Render expense summary section
   */
  renderExpenseSummary(section, data, context) {
    const { summary, byCategory, chargeableBreakdown, config } = data;
    
    let html = this.renderSectionHeader('Expense Summary', section, data.dateRange);

    // Summary cards
    html += this.renderSummaryCards([
      { label: 'Total Expenses', value: this.formatCurrency(summary.totalAmount), color: 'primary' },
      { label: 'Chargeable', value: this.formatCurrency(summary.chargeableAmount), color: 'success' },
      { label: 'Non-Chargeable', value: this.formatCurrency(summary.nonChargeableAmount), color: 'neutral' },
      { label: 'Entries', value: summary.validEntries, color: 'neutral' }
    ]);

    // Category chart
    if (config.includeChart && byCategory && byCategory.length > 0) {
      const chartData = byCategory.slice(0, 6).map((cat, i) => ({
        label: cat.category,
        value: cat.amount,
        color: Object.values(CHART_COLORS)[i % Object.keys(CHART_COLORS).length]
      }));
      html += this.renderDonutChart('Expenses by Category', chartData);
    }

    // Category breakdown table
    if (config.showByCategory && byCategory && byCategory.length > 0) {
      html += `<h4 class="subsection-title">Breakdown by Category</h4>`;
      html += this.renderTable(byCategory, [
        { key: 'category', header: 'Category', width: '60%' },
        { key: 'amount', header: 'Amount', width: '40%', format: 'currency' }
      ]);
    }

    return this.wrapSection(html);
  }

  // ─────────────────────────────────────────────────────────────
  // FORWARD-LOOKING SECTION RENDERERS
  // ─────────────────────────────────────────────────────────────

  /**
   * Render forward look section
   */
  renderForwardLook(section, data, context) {
    const { lookAheadRange, milestones, deliverables, dependencies, summary, config } = data;
    
    let html = this.renderSectionHeader(
      'Forward Look',
      section,
      null,
      `Looking ahead: ${lookAheadRange.label}`
    );

    // Summary cards
    html += this.renderSummaryCards([
      { label: 'Upcoming Milestones', value: summary.milestonesCount, color: 'primary' },
      { label: 'Upcoming Deliverables', value: summary.deliverablesCount, color: 'success' },
      { label: 'Open Dependencies', value: summary.dependenciesCount, color: 'warning' },
      { label: 'High Priority', value: summary.highPriorityDependencies, color: 'danger' }
    ]);

    // Upcoming milestones
    if (config.includeMilestones && milestones.length > 0) {
      html += `<h4 class="subsection-title">Upcoming Milestones</h4>`;
      html += this.renderTable(milestones, [
        { key: 'milestone_ref', header: 'Ref', width: '10%' },
        { key: 'name', header: 'Milestone', width: '50%' },
        { key: 'status', header: 'Status', width: '20%', format: 'status' },
        { key: 'due_date', header: 'Due Date', width: '20%', format: 'date' }
      ]);
    }

    // Upcoming deliverables
    if (config.includeDeliverables && deliverables.length > 0) {
      html += `<h4 class="subsection-title">Upcoming Deliverables</h4>`;
      html += this.renderTable(deliverables, [
        { key: 'deliverable_ref', header: 'Ref', width: '10%' },
        { key: 'name', header: 'Deliverable', width: '50%' },
        { key: 'status', header: 'Status', width: '20%', format: 'status' },
        { key: 'due_date', header: 'Due Date', width: '20%', format: 'date' }
      ]);
    }

    // Blocking dependencies
    if (config.includeDependencies && dependencies.length > 0) {
      html += `<h4 class="subsection-title">Blocking Dependencies</h4>`;
      const depsWithMilestone = dependencies.map(d => ({
        ...d,
        milestoneName: d.milestone?.name || '—'
      }));
      html += this.renderTable(depsWithMilestone, [
        { key: 'raid_ref', header: 'Ref', width: '10%' },
        { key: 'title', header: 'Dependency', width: '40%' },
        { key: 'severity', header: 'Severity', width: '15%', format: 'severity' },
        { key: 'milestoneName', header: 'Milestone', width: '20%' },
        { key: 'status', header: 'Status', width: '15%', format: 'status' }
      ]);
    }

    return this.wrapSection(html);
  }

  /**
   * Render upcoming milestones section
   */
  renderUpcomingMilestones(section, data, context) {
    const { lookAheadRange, items, summary, config } = data;
    
    let html = this.renderSectionHeader(
      'Upcoming Milestones',
      section,
      null,
      `Period: ${lookAheadRange.label}`
    );

    // Summary
    html += this.renderSummaryCards([
      { label: 'Total Upcoming', value: summary.total, color: 'primary' },
      { label: 'Not Started', value: summary.notStarted, color: 'neutral' },
      { label: 'In Progress', value: summary.inProgress, color: 'success' },
      { label: 'With Dependencies', value: summary.withBlockingDeps, color: 'warning' }
    ]);

    // Milestones table
    if (items.length > 0) {
      const columns = [
        { key: 'milestone_ref', header: 'Ref', width: '10%' },
        { key: 'name', header: 'Milestone', width: '45%' },
        { key: 'status', header: 'Status', width: '15%', format: 'status' },
        { key: 'due_date', header: 'Due Date', width: '15%', format: 'date' },
        { key: 'progress', header: 'Progress', width: '15%', format: 'percent' }
      ];

      html += this.renderTable(items, columns);

      // Show dependencies if enabled
      if (config.showDependencies) {
        items.forEach(milestone => {
          if (milestone.dependencies && milestone.dependencies.length > 0) {
            html += `
              <div class="dependency-list">
                <strong>${milestone.milestone_ref}</strong> has ${milestone.dependencies.length} blocking dependencies:
                <ul>
                  ${milestone.dependencies.map(d => `<li>${d.raid_ref}: ${d.title}</li>`).join('')}
                </ul>
              </div>
            `;
          }
        });
      }
    } else {
      html += this.renderEmptyMessage('No upcoming milestones in this period');
    }

    return this.wrapSection(html);
  }

  /**
   * Render upcoming deliverables section
   */
  renderUpcomingDeliverables(section, data, context) {
    const { lookAheadRange, items, groupedByMilestone, summary, config } = data;
    
    let html = this.renderSectionHeader(
      'Upcoming Deliverables',
      section,
      null,
      `Period: ${lookAheadRange.label}`
    );

    // Summary
    html += this.renderSummaryCards([
      { label: 'Total Due', value: summary.total, color: 'primary' },
      { label: 'Overdue', value: summary.overdue, color: 'danger' },
      { label: 'Due This Week', value: summary.dueThisWeek, color: 'warning' }
    ]);

    // Grouped by milestone or flat list
    if (config.groupByMilestone && groupedByMilestone) {
      Object.entries(groupedByMilestone).forEach(([key, group]) => {
        const milestoneName = group.milestone?.name || 'Unassigned';
        html += `<h4 class="subsection-title">${group.milestone?.milestone_ref || ''} ${milestoneName}</h4>`;
        html += this.renderTable(group.deliverables, [
          { key: 'deliverable_ref', header: 'Ref', width: '12%' },
          { key: 'name', header: 'Deliverable', width: '48%' },
          { key: 'status', header: 'Status', width: '20%', format: 'status' },
          { key: 'due_date', header: 'Due', width: '20%', format: 'date' }
        ], { highlightOverdue: config.highlightOverdue });
      });
    } else if (items.length > 0) {
      html += this.renderTable(items, [
        { key: 'deliverable_ref', header: 'Ref', width: '10%' },
        { key: 'name', header: 'Deliverable', width: '45%' },
        { key: 'status', header: 'Status', width: '15%', format: 'status' },
        { key: 'due_date', header: 'Due Date', width: '15%', format: 'date' }
      ], { highlightOverdue: config.highlightOverdue });
    } else {
      html += this.renderEmptyMessage('No deliverables due in this period');
    }

    return this.wrapSection(html);
  }

  // ─────────────────────────────────────────────────────────────
  // CONTENT SECTION RENDERERS
  // ─────────────────────────────────────────────────────────────

  /**
   * Render executive summary section
   */
  renderExecutiveSummary(section, data, context) {
    let html = this.renderSectionHeader('Executive Summary', section);
    
    const content = section.config?.content || data.content || '';
    
    if (content) {
      html += `<div class="executive-summary-content">${this.sanitizeHtml(content)}</div>`;
    } else {
      html += this.renderEmptyMessage('No executive summary provided');
    }

    return this.wrapSection(html);
  }

  /**
   * Render lessons learned section
   */
  renderLessonsLearned(section, data, context) {
    let html = this.renderSectionHeader('Lessons Learned', section);
    
    const content = section.config?.content;
    const formatType = section.config?.format || 'freeform';

    if (Array.isArray(content) && content.length > 0 && formatType === 'structured') {
      // Structured format
      html += '<div class="lessons-list">';
      content.forEach((lesson, index) => {
        html += `
          <div class="lesson-item">
            <div class="lesson-header">
              <span class="lesson-number">${index + 1}</span>
              <span class="lesson-category">${lesson.category || 'General'}</span>
            </div>
            <div class="lesson-content">
              <p><strong>Lesson:</strong> ${this.sanitizeHtml(lesson.lesson || '')}</p>
              ${lesson.recommendation ? `<p><strong>Recommendation:</strong> ${this.sanitizeHtml(lesson.recommendation)}</p>` : ''}
            </div>
          </div>
        `;
      });
      html += '</div>';
    } else if (typeof content === 'string' && content) {
      // Freeform format
      html += `<div class="lessons-content">${this.sanitizeHtml(content)}</div>`;
    } else {
      html += this.renderEmptyMessage('No lessons learned recorded');
    }

    return this.wrapSection(html);
  }

  /**
   * Render custom text section
   */
  renderCustomText(section, data, context) {
    const heading = section.config?.heading || 'Custom Section';
    const headingLevel = section.config?.headingLevel || 2;
    const content = section.config?.content || '';

    let html = '';
    
    // Use appropriate heading level
    const headingTag = `h${headingLevel}`;
    html += `<${headingTag} class="section-title">${this.sanitizeHtml(heading)}</${headingTag}>`;

    if (content) {
      html += `<div class="custom-content">${this.sanitizeHtml(content)}</div>`;
    }

    return this.wrapSection(html);
  }

  /**
   * Render resource summary section
   */
  renderResourceSummary(section, data, context) {
    const { summary, items, byRole, config } = data;
    
    let html = this.renderSectionHeader('Resource Summary', section, data.dateRange);

    // Summary cards
    html += this.renderSummaryCards([
      { label: 'Total Resources', value: summary.total, color: 'primary' },
      { label: 'PMO', value: summary.pmoCount, color: 'neutral' },
      { label: 'Delivery', value: summary.deliveryCount, color: 'success' },
      { label: 'Total Budget', value: this.formatCurrency(summary.totalBudget), color: 'primary' }
    ]);

    // Resource chart
    if (config.includeChart) {
      html += this.renderDonutChart('Resource Split', [
        { label: 'PMO', value: summary.pmoCount, color: CHART_COLORS.primary },
        { label: 'Delivery', value: summary.deliveryCount, color: CHART_COLORS.success }
      ]);
    }

    // Group by role or show flat list
    if (config.groupByRole && byRole) {
      Object.entries(byRole).forEach(([role, resources]) => {
        html += `<h4 class="subsection-title">${role}</h4>`;
        const columns = [
          { key: 'name', header: 'Name', width: '40%' }
        ];
        if (config.showAllocation) {
          columns.push({ key: 'daysAllocated', header: 'Days Allocated', width: '20%' });
        }
        columns.push({ key: 'budget', header: 'Budget', width: '25%', format: 'currency' });
        
        html += this.renderTable(resources, columns);
      });
    } else if (items.length > 0) {
      const columns = [
        { key: 'name', header: 'Name', width: '35%' },
        { key: 'role', header: 'Role', width: '25%' }
      ];
      if (config.showAllocation) {
        columns.push({ key: 'daysAllocated', header: 'Days', width: '15%' });
      }
      columns.push({ key: 'budget', header: 'Budget', width: '25%', format: 'currency' });

      html += this.renderTable(items, columns);
    } else {
      html += this.renderEmptyMessage('No resources assigned');
    }

    return this.wrapSection(html);
  }

  // ─────────────────────────────────────────────────────────────
  // HELPER RENDERING METHODS
  // ─────────────────────────────────────────────────────────────

  /**
   * Render section header
   */
  renderSectionHeader(title, section, dateRange = null, subtitle = null) {
    let html = `<h2 class="section-title">${title}</h2>`;
    
    if (dateRange) {
      html += `<p class="section-period">Reporting Period: ${dateRange.label}</p>`;
    }
    
    if (subtitle) {
      html += `<p class="section-subtitle">${subtitle}</p>`;
    }
    
    return html;
  }

  /**
   * Render summary cards row
   */
  renderSummaryCards(cards) {
    const cardsHtml = cards.map(card => {
      const colorClass = card.color || 'neutral';
      return `
        <div class="summary-card ${colorClass}">
          <div class="card-value">${card.value}</div>
          <div class="card-label">${card.label}</div>
        </div>
      `;
    }).join('');

    return `<div class="summary-cards">${cardsHtml}</div>`;
  }

  /**
   * Render a data table
   */
  renderTable(data, columns, options = {}) {
    if (!data || data.length === 0) {
      return this.renderEmptyMessage('No data available');
    }

    const headerRow = columns.map(col => 
      `<th style="width: ${col.width || 'auto'}">${col.header}</th>`
    ).join('');

    const bodyRows = data.map(row => {
      const rowClass = options.highlightOverdue && row.isOverdue ? 'overdue-row' : '';
      const cells = columns.map(col => {
        let value = row[col.key];
        value = this.formatCellValue(value, col.format);
        return `<td>${value}</td>`;
      }).join('');
      return `<tr class="${rowClass}">${cells}</tr>`;
    }).join('');

    return `
      <table class="data-table">
        <thead><tr>${headerRow}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    `;
  }

  /**
   * Render a simple donut chart as SVG
   */
  renderDonutChart(title, data) {
    const total = data.reduce((sum, d) => sum + (d.value || 0), 0);
    if (total === 0) return '';

    const size = 120;
    const strokeWidth = 25;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const center = size / 2;

    let currentOffset = 0;
    const segments = data.filter(d => d.value > 0).map(d => {
      const percent = d.value / total;
      const dashLength = percent * circumference;
      const dashOffset = circumference - currentOffset;
      currentOffset += dashLength;
      
      return `
        <circle
          cx="${center}" cy="${center}" r="${radius}"
          fill="none"
          stroke="${d.color}"
          stroke-width="${strokeWidth}"
          stroke-dasharray="${dashLength} ${circumference - dashLength}"
          stroke-dashoffset="${dashOffset}"
          transform="rotate(-90 ${center} ${center})"
        />
      `;
    }).join('');

    const legend = data.filter(d => d.value > 0).map(d => `
      <div class="legend-item">
        <span class="legend-color" style="background: ${d.color}"></span>
        <span class="legend-label">${d.label}: ${d.value}</span>
      </div>
    `).join('');

    return `
      <div class="chart-container">
        <h4 class="chart-title">${title}</h4>
        <div class="chart-wrapper">
          <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            ${segments}
            <text x="${center}" y="${center}" text-anchor="middle" dominant-baseline="middle" class="chart-center-text">
              ${total}
            </text>
          </svg>
          <div class="chart-legend">${legend}</div>
        </div>
      </div>
    `;
  }

  /**
   * Render a simple horizontal bar chart
   */
  renderBarChart(title, data) {
    const maxValue = Math.max(...data.map(d => d.value || 0));
    if (maxValue === 0) return '';

    const bars = data.map(d => {
      const percent = (d.value / maxValue) * 100;
      return `
        <div class="bar-row">
          <div class="bar-label">${d.label}</div>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${percent}%; background: ${d.color}"></div>
          </div>
          <div class="bar-value">${this.formatCurrency(d.value)}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="bar-chart-container">
        <h4 class="chart-title">${title}</h4>
        <div class="bar-chart">${bars}</div>
      </div>
    `;
  }

  /**
   * Wrap section content
   */
  wrapSection(content) {
    return `<section class="report-section">${content}</section>`;
  }

  /**
   * Render empty section placeholder
   */
  renderEmptySection(section) {
    const config = getSectionTypeConfig(section.type);
    return this.wrapSection(`
      <h2 class="section-title">${config?.name || section.type}</h2>
      <p class="empty-message">No data available for this section</p>
    `);
  }

  /**
   * Render error section
   */
  renderErrorSection(section, error) {
    const config = getSectionTypeConfig(section.type);
    return this.wrapSection(`
      <h2 class="section-title">${config?.name || section.type}</h2>
      <p class="error-message">Error loading section: ${error}</p>
    `);
  }

  /**
   * Render restricted section
   */
  renderRestrictedSection(section, message) {
    const config = getSectionTypeConfig(section.type);
    return this.wrapSection(`
      <h2 class="section-title">${config?.name || section.type}</h2>
      <p class="restricted-message">${message || 'You do not have permission to view this section'}</p>
    `);
  }

  /**
   * Render empty message
   */
  renderEmptyMessage(message) {
    return `<p class="empty-message">${message}</p>`;
  }

  // ─────────────────────────────────────────────────────────────
  // COVER PAGE & TABLE OF CONTENTS
  // ─────────────────────────────────────────────────────────────

  /**
   * Render cover page
   */
  renderCoverPage(template, context) {
    const metadata = template.template_definition?.metadata || {};
    const title = metadata.title || template.name || 'Project Report';
    const subtitle = this.resolveTemplateVariables(metadata.subtitle, context) || context.project?.name || '';
    
    return `
      <div class="cover-page">
        <div class="cover-content">
          <h1 class="cover-title">${title}</h1>
          ${subtitle ? `<h2 class="cover-subtitle">${subtitle}</h2>` : ''}
          <div class="cover-meta">
            <p>Generated: ${format(new Date(), 'dd MMMM yyyy')}</p>
            ${context.user?.full_name ? `<p>By: ${context.user.full_name}</p>` : ''}
          </div>
        </div>
      </div>
      <div class="page-break"></div>
    `;
  }

  /**
   * Render table of contents
   */
  renderTableOfContents(sections, sectionData) {
    const items = sections.map((section, index) => {
      const config = getSectionTypeConfig(section.type);
      const name = section.name || config?.name || section.type;
      return `<li><a href="#section-${index}">${name}</a></li>`;
    }).join('');

    return `
      <div class="table-of-contents">
        <h2>Contents</h2>
        <ol>${items}</ol>
      </div>
      <div class="page-break"></div>
    `;
  }

  // ─────────────────────────────────────────────────────────────
  // DOCUMENT WRAPPER
  // ─────────────────────────────────────────────────────────────

  /**
   * Wrap sections in full HTML document
   */
  wrapDocument(sectionsHtml, template, context) {
    const metadata = template.template_definition?.metadata || {};
    const title = metadata.title || template.name || 'Report';
    const styles = this.getReportStyles();

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>${styles}</style>
</head>
<body>
  <div class="report-container">
    ${sectionsHtml}
  </div>
  <footer class="report-footer">
    <p>Generated on ${format(new Date(), 'dd MMMM yyyy')} at ${format(new Date(), 'HH:mm')}</p>
  </footer>
</body>
</html>
    `.trim();
  }

  /**
   * Build report context with computed values
   */
  buildReportContext(template, context) {
    return {
      ...context,
      generated: {
        date: format(new Date(), 'dd MMMM yyyy'),
        time: format(new Date(), 'HH:mm'),
        by: context.user?.full_name || 'System'
      },
      template: {
        name: template.name,
        type: template.report_type
      }
    };
  }

  // ─────────────────────────────────────────────────────────────
  // FORMATTING UTILITIES
  // ─────────────────────────────────────────────────────────────

  /**
   * Format cell value based on type
   */
  formatCellValue(value, formatType) {
    if (value === null || value === undefined) return '—';
    
    switch (formatType) {
      case 'date':
        return this.formatDate(value);
      case 'currency':
        return this.formatCurrency(value);
      case 'currencyVariance':
        return this.formatCurrencyVariance(value);
      case 'percent':
        return `${value}%`;
      case 'status':
        return this.formatStatus(value);
      case 'rag':
        return this.formatRAG(value);
      case 'severity':
        return this.formatSeverity(value);
      default:
        return String(value);
    }
  }

  formatDate(value) {
    if (!value) return '—';
    try {
      const date = typeof value === 'string' ? new Date(value) : value;
      return format(date, 'dd MMM yyyy');
    } catch {
      return value;
    }
  }

  formatCurrency(value) {
    const num = parseFloat(value) || 0;
    return `£${num.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }

  formatCurrencyVariance(value) {
    const num = parseFloat(value) || 0;
    const sign = num >= 0 ? '+' : '';
    const className = num >= 0 ? 'positive' : 'negative';
    return `<span class="${className}">${sign}£${Math.abs(num).toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>`;
  }

  formatNumber(value) {
    const num = parseFloat(value) || 0;
    return num.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
  }

  formatStatus(status) {
    const color = STATUS_COLORS[status] || CHART_COLORS.neutral;
    return `<span class="status-badge" style="background: ${color}">${status}</span>`;
  }

  formatRAG(rag) {
    const colors = {
      'Green': '#22C55E',
      'Amber': '#F59E0B',
      'Red': '#EF4444'
    };
    const color = colors[rag] || CHART_COLORS.neutral;
    return `<span class="rag-indicator" style="background: ${color}">${rag}</span>`;
  }

  formatSeverity(severity) {
    const color = STATUS_COLORS[severity] || CHART_COLORS.neutral;
    return `<span class="severity-badge" style="background: ${color}">${severity}</span>`;
  }

  /**
   * Resolve template variables like {{project.name}}
   */
  resolveTemplateVariables(text, context) {
    if (!text || typeof text !== 'string') return text;
    
    return text.replace(/\{\{(\w+)\.(\w+)\}\}/g, (match, obj, prop) => {
      return context[obj]?.[prop] || match;
    });
  }

  /**
   * Basic HTML sanitization
   */
  sanitizeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br>');
  }

  // ─────────────────────────────────────────────────────────────
  // CSS STYLES
  // ─────────────────────────────────────────────────────────────

  /**
   * Get complete report CSS styles
   */
  getReportStyles() {
    return `
      /* Base Styles */
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        font-size: 12px;
        line-height: 1.5;
        color: #1f2937;
        background: #fff;
      }
      
      .report-container {
        max-width: 900px;
        margin: 0 auto;
        padding: 20px;
      }
      
      /* Cover Page */
      .cover-page {
        height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
      }
      
      .cover-title {
        font-size: 32px;
        font-weight: 700;
        color: #111827;
        margin-bottom: 16px;
      }
      
      .cover-subtitle {
        font-size: 20px;
        font-weight: 400;
        color: #6b7280;
        margin-bottom: 32px;
      }
      
      .cover-meta {
        font-size: 14px;
        color: #9ca3af;
      }
      
      /* Table of Contents */
      .table-of-contents {
        padding: 20px 0;
      }
      
      .table-of-contents h2 {
        font-size: 24px;
        margin-bottom: 20px;
        color: #111827;
      }
      
      .table-of-contents ol {
        padding-left: 24px;
      }
      
      .table-of-contents li {
        margin-bottom: 8px;
      }
      
      .table-of-contents a {
        color: #3b82f6;
        text-decoration: none;
      }
      
      /* Section Styles */
      .report-section {
        margin-bottom: 40px;
        padding-bottom: 20px;
        border-bottom: 1px solid #e5e7eb;
        page-break-inside: avoid;
      }
      
      .section-title {
        font-size: 20px;
        font-weight: 600;
        color: #111827;
        margin-bottom: 8px;
        padding-bottom: 8px;
        border-bottom: 2px solid #3b82f6;
      }
      
      .section-period,
      .section-subtitle {
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 16px;
      }
      
      .subsection-title {
        font-size: 14px;
        font-weight: 600;
        color: #374151;
        margin: 20px 0 12px;
      }
      
      /* Summary Cards */
      .summary-cards {
        display: flex;
        gap: 12px;
        margin-bottom: 20px;
        flex-wrap: wrap;
      }
      
      .summary-card {
        flex: 1;
        min-width: 120px;
        padding: 12px 16px;
        background: #f9fafb;
        border-radius: 8px;
        text-align: center;
      }
      
      .summary-card.success { background: #f0fdf4; }
      .summary-card.danger { background: #fef2f2; }
      .summary-card.warning { background: #fffbeb; }
      .summary-card.primary { background: #eff6ff; }
      
      .card-value {
        font-size: 24px;
        font-weight: 700;
        color: #111827;
      }
      
      .summary-card.success .card-value { color: #16a34a; }
      .summary-card.danger .card-value { color: #dc2626; }
      .summary-card.warning .card-value { color: #d97706; }
      .summary-card.primary .card-value { color: #2563eb; }
      
      .card-label {
        font-size: 11px;
        color: #6b7280;
        margin-top: 4px;
      }
      
      /* Data Tables */
      .data-table {
        width: 100%;
        border-collapse: collapse;
        margin: 16px 0;
        font-size: 11px;
      }
      
      .data-table th {
        background: #f3f4f6;
        padding: 10px 12px;
        text-align: left;
        font-weight: 600;
        color: #374151;
        border-bottom: 2px solid #e5e7eb;
      }
      
      .data-table td {
        padding: 10px 12px;
        border-bottom: 1px solid #e5e7eb;
        vertical-align: top;
      }
      
      .data-table tr:hover {
        background: #f9fafb;
      }
      
      .data-table .overdue-row {
        background: #fef2f2;
      }
      
      /* Status Badges */
      .status-badge,
      .rag-indicator,
      .severity-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
        color: white;
      }
      
      /* Charts */
      .chart-container {
        margin: 20px 0;
        padding: 16px;
        background: #f9fafb;
        border-radius: 8px;
      }
      
      .chart-title {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 12px;
        color: #374151;
      }
      
      .chart-wrapper {
        display: flex;
        align-items: center;
        gap: 24px;
      }
      
      .chart-legend {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      
      .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 11px;
      }
      
      .legend-color {
        width: 12px;
        height: 12px;
        border-radius: 2px;
      }
      
      .chart-center-text {
        font-size: 18px;
        font-weight: 700;
        fill: #374151;
      }
      
      /* Bar Chart */
      .bar-chart-container {
        margin: 20px 0;
      }
      
      .bar-chart {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      
      .bar-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .bar-label {
        width: 80px;
        font-size: 11px;
        color: #6b7280;
      }
      
      .bar-track {
        flex: 1;
        height: 20px;
        background: #e5e7eb;
        border-radius: 4px;
        overflow: hidden;
      }
      
      .bar-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.3s;
      }
      
      .bar-value {
        width: 100px;
        text-align: right;
        font-size: 11px;
        font-weight: 600;
      }
      
      /* Budget Section */
      .budget-overview {
        margin-bottom: 20px;
      }
      
      .budget-row {
        display: flex;
        gap: 16px;
        flex-wrap: wrap;
      }
      
      .budget-item {
        flex: 1;
        min-width: 150px;
        padding: 16px;
        background: #f9fafb;
        border-radius: 8px;
      }
      
      .budget-label {
        display: block;
        font-size: 11px;
        color: #6b7280;
        margin-bottom: 4px;
      }
      
      .budget-value {
        display: block;
        font-size: 20px;
        font-weight: 700;
        color: #111827;
      }
      
      .budget-item.positive .budget-value { color: #16a34a; }
      .budget-item.negative .budget-value { color: #dc2626; }
      
      .positive { color: #16a34a; }
      .negative { color: #dc2626; }
      
      /* Two Column Layout */
      .two-column {
        display: flex;
        gap: 24px;
        margin: 16px 0;
      }
      
      .column {
        flex: 1;
        padding: 16px;
        background: #f9fafb;
        border-radius: 8px;
      }
      
      .column h5 {
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 12px;
        color: #374151;
      }
      
      .mini-stats {
        font-size: 12px;
        line-height: 1.8;
      }
      
      /* Stats Row */
      .stats-row {
        display: flex;
        gap: 24px;
        padding: 12px 16px;
        background: #f9fafb;
        border-radius: 8px;
        margin-top: 16px;
        font-size: 12px;
        color: #6b7280;
      }
      
      /* Content Sections */
      .executive-summary-content,
      .lessons-content,
      .custom-content {
        padding: 16px;
        background: #f9fafb;
        border-radius: 8px;
        line-height: 1.7;
      }
      
      .lessons-list {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      
      .lesson-item {
        padding: 16px;
        background: #f9fafb;
        border-radius: 8px;
        border-left: 4px solid #3b82f6;
      }
      
      .lesson-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 8px;
      }
      
      .lesson-number {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        background: #3b82f6;
        color: white;
        border-radius: 50%;
        font-size: 12px;
        font-weight: 600;
      }
      
      .lesson-category {
        font-size: 11px;
        color: #6b7280;
        background: #e5e7eb;
        padding: 2px 8px;
        border-radius: 4px;
      }
      
      .lesson-content p {
        margin-bottom: 8px;
      }
      
      /* Dependencies */
      .dependency-list {
        margin: 12px 0;
        padding: 12px 16px;
        background: #fffbeb;
        border-radius: 8px;
        font-size: 11px;
      }
      
      .dependency-list ul {
        margin-top: 8px;
        padding-left: 20px;
      }
      
      /* Messages */
      .empty-message,
      .error-message,
      .restricted-message {
        padding: 20px;
        text-align: center;
        color: #6b7280;
        font-style: italic;
        background: #f9fafb;
        border-radius: 8px;
      }
      
      .error-message {
        background: #fef2f2;
        color: #dc2626;
      }
      
      .restricted-message {
        background: #fffbeb;
        color: #d97706;
      }
      
      /* Footer */
      .report-footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #e5e7eb;
        text-align: center;
        font-size: 10px;
        color: #9ca3af;
      }
      
      /* Page Break */
      .page-break {
        page-break-after: always;
      }
      
      /* Print Styles */
      @media print {
        body {
          font-size: 10pt;
          color: #000;
        }
        
        .report-container {
          max-width: none;
          padding: 0;
        }
        
        .report-section {
          page-break-inside: avoid;
        }
        
        .summary-cards {
          break-inside: avoid;
        }
        
        .data-table {
          page-break-inside: auto;
        }
        
        .data-table tr {
          page-break-inside: avoid;
        }
        
        .chart-container {
          page-break-inside: avoid;
        }
        
        .cover-page {
          page-break-after: always;
        }
        
        .table-of-contents {
          page-break-after: always;
        }
        
        .summary-card,
        .budget-item,
        .column {
          background: #f5f5f5 !important;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .status-badge,
        .rag-indicator,
        .severity-badge {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        @page {
          size: A4;
          margin: 15mm;
        }
      }
    `;
  }

  getDefaultStyles() {
    return this.getReportStyles();
  }
}

// Export singleton instance
export const reportRendererService = new ReportRendererService();
export default reportRendererService;
