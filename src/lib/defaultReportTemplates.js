/**
 * Default Report Templates
 * 
 * Pre-built report templates for common reporting needs.
 * These templates are loaded into the template selector in the Report Builder Wizard.
 * 
 * Templates defined:
 * 1. Monthly Retrospective - Comprehensive monthly report for stakeholder meetings
 * 2. Project Status Summary - Quick overview of current project status
 * 3. Budget Variance Report - Financial analysis with budget vs actual comparison
 * 
 * @version 1.0
 * @created 11 December 2025
 * @see docs/IMPLEMENTATION-Report-Builder-Wizard.md Segment 12
 */

import { SECTION_TYPE } from './reportSectionTypes';
import { REPORT_TYPE, REPORTING_PERIOD } from '../services/reportTemplates.service';

// ============================================
// MONTHLY RETROSPECTIVE TEMPLATE
// ============================================

/**
 * Monthly Retrospective Template
 * 
 * Comprehensive report for monthly programme reviews and stakeholder meetings.
 * Includes backward-looking analysis of the past month and forward-looking
 * preview of upcoming work.
 * 
 * Sections:
 * - Executive Summary
 * - Milestone Summary
 * - Deliverable Summary
 * - KPI Performance
 * - Budget Analysis
 * - RAID Summary
 * - Lessons Learned
 * - Forward Look
 */
export const MONTHLY_RETROSPECTIVE_TEMPLATE = {
  code: 'monthly_retrospective',
  name: 'Monthly Retrospective',
  description: 'Comprehensive monthly report for stakeholder meetings. Includes executive summary, milestone progress, KPI performance, budget analysis, RAID review, lessons learned, and forward look.',
  report_type: REPORT_TYPE.MONTHLY_RETROSPECTIVE,
  is_system: true,
  is_default: true,
  template_definition: {
    metadata: {
      title: 'Monthly Programme Retrospective',
      subtitle: '{{project.name}}',
      generatedAt: '{{generated.date}}',
      generatedBy: '{{generated.by}}',
      includeCoverPage: true,
      includeTableOfContents: true
    },
    sections: [
      {
        id: 'section_exec_summary',
        type: SECTION_TYPE.EXECUTIVE_SUMMARY,
        name: 'Executive Summary',
        config: {
          content: '',
          includeAIGeneration: true
        }
      },
      {
        id: 'section_milestones',
        type: SECTION_TYPE.MILESTONE_SUMMARY,
        name: 'Milestone Summary',
        config: {
          statusFilter: ['Completed', 'In Progress', 'Not Started'],
          includeChart: true,
          showBudget: true
        }
      },
      {
        id: 'section_deliverables',
        type: SECTION_TYPE.DELIVERABLE_SUMMARY,
        name: 'Deliverable Summary',
        config: {
          statusFilter: ['Delivered', 'In Progress', 'Overdue'],
          includeChart: true,
          highlightOverdue: true
        }
      },
      {
        id: 'section_kpis',
        type: SECTION_TYPE.KPI_PERFORMANCE,
        name: 'KPI Performance',
        config: {
          includeChart: true,
          showRAG: true,
          includeTarget: true
        }
      },
      {
        id: 'section_budget',
        type: SECTION_TYPE.BUDGET_ANALYSIS,
        name: 'Budget Analysis',
        config: {
          includeChart: true,
          showPMOvsDelivery: true,
          showByMilestone: true
        }
      },
      {
        id: 'section_raid',
        type: SECTION_TYPE.RAID_SUMMARY,
        name: 'RAID Summary',
        config: {
          categoryFilter: ['Risk', 'Assumption', 'Issue', 'Dependency'],
          statusFilter: ['Open', 'Mitigated'],
          includeChart: true,
          showDetails: true,
          maxItems: 20
        }
      },
      {
        id: 'section_lessons',
        type: SECTION_TYPE.LESSONS_LEARNED,
        name: 'Lessons Learned',
        config: {
          format: 'structured',
          content: []
        }
      },
      {
        id: 'section_forward',
        type: SECTION_TYPE.FORWARD_LOOK,
        name: 'Forward Look',
        config: {
          lookAheadPeriod: '3months',
          includeMilestones: true,
          includeDeliverables: true,
          includeDependencies: true
        }
      }
    ]
  },
  default_parameters: {
    reportingPeriod: REPORTING_PERIOD.LAST_MONTH,
    includeCoverPage: true,
    includeTableOfContents: true
  }
};

// ============================================
// PROJECT STATUS SUMMARY TEMPLATE
// ============================================

/**
 * Project Status Summary Template
 * 
 * Quick overview report for status updates and brief reviews.
 * Focuses on key metrics without extensive detail.
 * 
 * Sections:
 * - Executive Summary
 * - Milestone Summary
 * - KPI Performance
 * - RAID Summary (Risks only)
 */
export const PROJECT_STATUS_TEMPLATE = {
  code: 'project_status',
  name: 'Project Status Summary',
  description: 'Quick overview of current project status. Ideal for weekly updates and brief stakeholder communications.',
  report_type: REPORT_TYPE.STATUS_SUMMARY,
  is_system: true,
  is_default: false,
  template_definition: {
    metadata: {
      title: 'Project Status Summary',
      subtitle: '{{project.name}}',
      generatedAt: '{{generated.date}}',
      generatedBy: '{{generated.by}}',
      includeCoverPage: false,
      includeTableOfContents: false
    },
    sections: [
      {
        id: 'section_exec_summary',
        type: SECTION_TYPE.EXECUTIVE_SUMMARY,
        name: 'Executive Summary',
        config: {
          content: '',
          includeAIGeneration: true
        }
      },
      {
        id: 'section_milestones',
        type: SECTION_TYPE.MILESTONE_SUMMARY,
        name: 'Milestone Progress',
        config: {
          statusFilter: ['Completed', 'In Progress'],
          includeChart: true,
          showBudget: false
        }
      },
      {
        id: 'section_kpis',
        type: SECTION_TYPE.KPI_PERFORMANCE,
        name: 'KPI Performance',
        config: {
          includeChart: true,
          showRAG: true,
          includeTarget: true
        }
      },
      {
        id: 'section_risks',
        type: SECTION_TYPE.RAID_SUMMARY,
        name: 'Key Risks',
        config: {
          categoryFilter: ['Risk'],
          statusFilter: ['Open'],
          includeChart: false,
          showDetails: true,
          maxItems: 10
        }
      }
    ]
  },
  default_parameters: {
    reportingPeriod: REPORTING_PERIOD.LAST_MONTH,
    includeCoverPage: false,
    includeTableOfContents: false
  }
};

// ============================================
// BUDGET VARIANCE REPORT TEMPLATE
// ============================================

/**
 * Budget Variance Report Template
 * 
 * Financial analysis report focusing on budget vs actual spend.
 * Includes expense breakdown and timesheet analysis.
 * 
 * Sections:
 * - Budget Analysis
 * - Expense Summary
 * - Timesheet Summary
 */
export const BUDGET_VARIANCE_TEMPLATE = {
  code: 'budget_variance',
  name: 'Budget Variance Report',
  description: 'Financial analysis with budget vs actual comparison. Includes detailed expense and timesheet summaries.',
  report_type: REPORT_TYPE.BUDGET_VARIANCE,
  is_system: true,
  is_default: false,
  template_definition: {
    metadata: {
      title: 'Budget Variance Report',
      subtitle: '{{project.name}}',
      generatedAt: '{{generated.date}}',
      generatedBy: '{{generated.by}}',
      includeCoverPage: true,
      includeTableOfContents: false
    },
    sections: [
      {
        id: 'section_budget',
        type: SECTION_TYPE.BUDGET_ANALYSIS,
        name: 'Budget Analysis',
        config: {
          includeChart: true,
          showPMOvsDelivery: true,
          showByMilestone: true
        }
      },
      {
        id: 'section_expenses',
        type: SECTION_TYPE.EXPENSE_SUMMARY,
        name: 'Expense Summary',
        config: {
          includeChart: true,
          showByCategory: true
        }
      },
      {
        id: 'section_timesheets',
        type: SECTION_TYPE.TIMESHEET_SUMMARY,
        name: 'Timesheet Summary',
        config: {
          includeChart: true
        }
      }
    ]
  },
  default_parameters: {
    reportingPeriod: REPORTING_PERIOD.LAST_QUARTER,
    includeCoverPage: true,
    includeTableOfContents: false
  }
};

// ============================================
// RESOURCE UTILISATION TEMPLATE
// ============================================

/**
 * Resource Utilisation Report Template
 * 
 * Report focused on resource allocation and utilisation.
 * Includes timesheet data and resource breakdown.
 * 
 * Sections:
 * - Resource Summary
 * - Timesheet Summary
 * - Budget Analysis (resource cost focus)
 */
export const RESOURCE_UTILISATION_TEMPLATE = {
  code: 'resource_utilisation',
  name: 'Resource Utilisation Report',
  description: 'Resource allocation and utilisation analysis. Shows team allocation, time tracking, and cost distribution.',
  report_type: REPORT_TYPE.CUSTOM,
  is_system: true,
  is_default: false,
  template_definition: {
    metadata: {
      title: 'Resource Utilisation Report',
      subtitle: '{{project.name}}',
      generatedAt: '{{generated.date}}',
      generatedBy: '{{generated.by}}',
      includeCoverPage: false,
      includeTableOfContents: false
    },
    sections: [
      {
        id: 'section_resources',
        type: SECTION_TYPE.RESOURCE_SUMMARY,
        name: 'Resource Summary',
        config: {
          includeChart: true,
          groupByRole: true,
          showAllocation: true
        }
      },
      {
        id: 'section_timesheets',
        type: SECTION_TYPE.TIMESHEET_SUMMARY,
        name: 'Time Tracking',
        config: {
          includeChart: true
        }
      },
      {
        id: 'section_budget',
        type: SECTION_TYPE.BUDGET_ANALYSIS,
        name: 'Cost Analysis',
        config: {
          includeChart: true,
          showPMOvsDelivery: true,
          showByMilestone: false
        }
      }
    ]
  },
  default_parameters: {
    reportingPeriod: REPORTING_PERIOD.LAST_MONTH,
    includeCoverPage: false,
    includeTableOfContents: false
  }
};

// ============================================
// ALL DEFAULT TEMPLATES
// ============================================

/**
 * Array of all default templates
 * Import this to seed templates or display in template selector
 */
export const DEFAULT_REPORT_TEMPLATES = [
  MONTHLY_RETROSPECTIVE_TEMPLATE,
  PROJECT_STATUS_TEMPLATE,
  BUDGET_VARIANCE_TEMPLATE,
  RESOURCE_UTILISATION_TEMPLATE
];

/**
 * Get a default template by code
 * @param {string} code - Template code
 * @returns {Object|null} Template definition or null if not found
 */
export function getDefaultTemplateByCode(code) {
  return DEFAULT_REPORT_TEMPLATES.find(t => t.code === code) || null;
}

/**
 * Get all default templates for a specific report type
 * @param {string} reportType - Report type from REPORT_TYPE constants
 * @returns {Array} Matching templates
 */
export function getDefaultTemplatesByType(reportType) {
  return DEFAULT_REPORT_TEMPLATES.filter(t => t.report_type === reportType);
}

/**
 * Get the default template (marked as is_default)
 * @returns {Object} The default template
 */
export function getDefaultTemplate() {
  return DEFAULT_REPORT_TEMPLATES.find(t => t.is_default) || DEFAULT_REPORT_TEMPLATES[0];
}

export default DEFAULT_REPORT_TEMPLATES;
