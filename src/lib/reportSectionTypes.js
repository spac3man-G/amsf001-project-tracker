/**
 * Report Section Type Definitions
 * 
 * Defines all available section types for the Report Builder Wizard.
 * Each section type includes:
 * - Display metadata (name, description, icon)
 * - Category classification (backward, forward, content)
 * - Data source information
 * - Configuration schema for customisation options
 * 
 * @version 1.0
 * @created 11 December 2025
 */

import {
  Target,
  CheckSquare,
  TrendingUp,
  Award,
  DollarSign,
  AlertTriangle,
  Clock,
  Receipt,
  CalendarClock,
  BookOpen,
  FileText,
  PenLine,
  BarChart3,
  Users,
  Milestone,
  ArrowRight,
  ClipboardList
} from 'lucide-react';

// ============================================
// SECTION TYPE CONSTANTS
// ============================================

/**
 * Section type identifiers
 * Use these constants throughout the application
 */
export const SECTION_TYPE = {
  // Backward-looking sections (historical data)
  MILESTONE_SUMMARY: 'milestone_summary',
  DELIVERABLE_SUMMARY: 'deliverable_summary',
  KPI_PERFORMANCE: 'kpi_performance',
  QUALITY_STANDARDS: 'quality_standards',
  BUDGET_ANALYSIS: 'budget_analysis',
  RAID_SUMMARY: 'raid_summary',
  TIMESHEET_SUMMARY: 'timesheet_summary',
  EXPENSE_SUMMARY: 'expense_summary',
  
  // Forward-looking sections (upcoming items)
  FORWARD_LOOK: 'forward_look',
  UPCOMING_MILESTONES: 'upcoming_milestones',
  UPCOMING_DELIVERABLES: 'upcoming_deliverables',
  
  // Content sections (user/AI generated)
  EXECUTIVE_SUMMARY: 'executive_summary',
  LESSONS_LEARNED: 'lessons_learned',
  CUSTOM_TEXT: 'custom_text',
  RESOURCE_SUMMARY: 'resource_summary'
};

// ============================================
// CATEGORY DEFINITIONS
// ============================================

/**
 * Section categories for grouping in the UI
 */
export const SECTION_CATEGORY = {
  BACKWARD: 'backward',
  FORWARD: 'forward',
  CONTENT: 'content'
};

export const SECTION_CATEGORY_CONFIG = {
  [SECTION_CATEGORY.BACKWARD]: {
    label: 'Backward-Looking',
    description: 'Historical data and completed work',
    icon: ClipboardList,
    order: 1
  },
  [SECTION_CATEGORY.FORWARD]: {
    label: 'Forward-Looking',
    description: 'Upcoming work and forecasts',
    icon: ArrowRight,
    order: 2
  },
  [SECTION_CATEGORY.CONTENT]: {
    label: 'Content & Analysis',
    description: 'Summaries, insights, and custom content',
    icon: PenLine,
    order: 3
  }
};

// ============================================
// DATA SOURCE TYPES
// ============================================

/**
 * Data source types indicating where section data comes from
 */
export const DATA_SOURCE = {
  METRICS_SERVICE: 'metricsService',
  RAID_SERVICE: 'raidService',
  CUSTOM_QUERY: 'customQuery',
  USER_INPUT: 'userInput',
  AI_GENERATED: 'aiGenerated'
};

// ============================================
// CONFIG FIELD TYPES
// ============================================

/**
 * Field types for section configuration schemas
 */
export const CONFIG_FIELD_TYPE = {
  SELECT: 'select',
  MULTI_SELECT: 'multiSelect',
  BOOLEAN: 'boolean',
  NUMBER: 'number',
  TEXT: 'text',
  TEXTAREA: 'textarea',
  DATE_RANGE: 'dateRange'
};

// ============================================
// SECTION TYPE CONFIGURATIONS
// ============================================

/**
 * Complete configuration for each section type
 */
export const SECTION_TYPE_CONFIG = {
  // --------------------------------------------------------
  // BACKWARD-LOOKING SECTIONS
  // --------------------------------------------------------

  [SECTION_TYPE.MILESTONE_SUMMARY]: {
    type: SECTION_TYPE.MILESTONE_SUMMARY,
    name: 'Milestone Summary',
    description: 'Overview of milestone status and progress during the reporting period',
    icon: Milestone,
    category: SECTION_CATEGORY.BACKWARD,
    dataSource: DATA_SOURCE.METRICS_SERVICE,
    dataMethod: 'getMilestoneMetrics',
    
    // Default configuration values
    defaultConfig: {
      includeChart: true,
      statusFilter: ['all'],
      showBudget: true,
      showProgress: true,
      sortBy: 'milestone_ref'
    },
    
    // Configuration schema for the config modal
    configSchema: {
      includeChart: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Include Progress Chart',
        description: 'Show visual milestone status breakdown',
        default: true
      },
      statusFilter: {
        type: CONFIG_FIELD_TYPE.MULTI_SELECT,
        label: 'Status Filter',
        description: 'Which milestone statuses to include',
        options: [
          { value: 'all', label: 'All Statuses' },
          { value: 'Completed', label: 'Completed' },
          { value: 'In Progress', label: 'In Progress' },
          { value: 'Not Started', label: 'Not Started' },
          { value: 'On Hold', label: 'On Hold' }
        ],
        default: ['all']
      },
      showBudget: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Show Budget Allocation',
        description: 'Display budget values per milestone',
        default: true,
        roleRestriction: ['admin', 'supplier_pm'] // Only visible to these roles
      },
      showProgress: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Show Progress Percentage',
        description: 'Display completion percentage',
        default: true
      },
      sortBy: {
        type: CONFIG_FIELD_TYPE.SELECT,
        label: 'Sort By',
        options: [
          { value: 'milestone_ref', label: 'Milestone Reference' },
          { value: 'status', label: 'Status' },
          { value: 'progress', label: 'Progress' }
        ],
        default: 'milestone_ref'
      }
    }
  },

  [SECTION_TYPE.DELIVERABLE_SUMMARY]: {
    type: SECTION_TYPE.DELIVERABLE_SUMMARY,
    name: 'Deliverable Summary',
    description: 'Status of deliverables completed and in progress during the period',
    icon: CheckSquare,
    category: SECTION_CATEGORY.BACKWARD,
    dataSource: DATA_SOURCE.METRICS_SERVICE,
    dataMethod: 'getDeliverableMetrics',
    
    defaultConfig: {
      includeChart: true,
      statusFilter: ['all'],
      groupByMilestone: false,
      highlightOverdue: true,
      sortBy: 'deliverable_ref'
    },
    
    configSchema: {
      includeChart: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Include Status Chart',
        description: 'Show visual deliverable status breakdown',
        default: true
      },
      statusFilter: {
        type: CONFIG_FIELD_TYPE.MULTI_SELECT,
        label: 'Status Filter',
        options: [
          { value: 'all', label: 'All Statuses' },
          { value: 'Delivered', label: 'Delivered' },
          { value: 'In Review', label: 'In Review' },
          { value: 'Submitted', label: 'Submitted' },
          { value: 'Draft', label: 'Draft' }
        ],
        default: ['all']
      },
      groupByMilestone: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Group by Milestone',
        description: 'Organise deliverables under their parent milestone',
        default: false
      },
      highlightOverdue: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Highlight Overdue',
        description: 'Emphasise deliverables past their due date',
        default: true
      },
      sortBy: {
        type: CONFIG_FIELD_TYPE.SELECT,
        label: 'Sort By',
        options: [
          { value: 'deliverable_ref', label: 'Deliverable Reference' },
          { value: 'due_date', label: 'Due Date' },
          { value: 'status', label: 'Status' }
        ],
        default: 'deliverable_ref'
      }
    }
  },

  [SECTION_TYPE.KPI_PERFORMANCE]: {
    type: SECTION_TYPE.KPI_PERFORMANCE,
    name: 'KPI Performance',
    description: 'Key Performance Indicator achievement against targets',
    icon: TrendingUp,
    category: SECTION_CATEGORY.BACKWARD,
    dataSource: DATA_SOURCE.METRICS_SERVICE,
    dataMethod: 'getKPIMetrics',
    
    defaultConfig: {
      includeChart: true,
      showRAG: true,
      groupByCategory: true,
      includeTarget: true,
      sortBy: 'kpi_ref'
    },
    
    configSchema: {
      includeChart: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Include Performance Chart',
        description: 'Show visual KPI performance indicators',
        default: true
      },
      showRAG: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Show RAG Status',
        description: 'Display Red/Amber/Green indicators',
        default: true
      },
      groupByCategory: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Group by Category',
        description: 'Organise KPIs by their category',
        default: true
      },
      includeTarget: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Show Target Values',
        description: 'Display target alongside actual',
        default: true
      },
      sortBy: {
        type: CONFIG_FIELD_TYPE.SELECT,
        label: 'Sort By',
        options: [
          { value: 'kpi_ref', label: 'KPI Reference' },
          { value: 'category', label: 'Category' },
          { value: 'performance', label: 'Performance (Low to High)' },
          { value: 'ragStatus', label: 'RAG Status' }
        ],
        default: 'kpi_ref'
      }
    }
  },

  [SECTION_TYPE.QUALITY_STANDARDS]: {
    type: SECTION_TYPE.QUALITY_STANDARDS,
    name: 'Quality Standards',
    description: 'Compliance status against defined quality standards',
    icon: Award,
    category: SECTION_CATEGORY.BACKWARD,
    dataSource: DATA_SOURCE.METRICS_SERVICE,
    dataMethod: 'getQualityStandardMetrics',
    
    defaultConfig: {
      includeChart: true,
      showAssessmentCount: true,
      sortBy: 'qs_ref'
    },
    
    configSchema: {
      includeChart: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Include Compliance Chart',
        description: 'Show visual compliance summary',
        default: true
      },
      showAssessmentCount: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Show Assessment Details',
        description: 'Display number of assessments per standard',
        default: true
      },
      sortBy: {
        type: CONFIG_FIELD_TYPE.SELECT,
        label: 'Sort By',
        options: [
          { value: 'qs_ref', label: 'QS Reference' },
          { value: 'compliance', label: 'Compliance Rate' }
        ],
        default: 'qs_ref'
      }
    }
  },

  [SECTION_TYPE.BUDGET_ANALYSIS]: {
    type: SECTION_TYPE.BUDGET_ANALYSIS,
    name: 'Budget Analysis',
    description: 'Budget utilisation, spend breakdown, and variance analysis',
    icon: DollarSign,
    category: SECTION_CATEGORY.BACKWARD,
    dataSource: DATA_SOURCE.METRICS_SERVICE,
    dataMethod: 'getAllDashboardMetrics',
    roleRestriction: ['admin', 'supplier_pm'],
    
    defaultConfig: {
      includeChart: true,
      showPMOvsDelivery: true,
      showByMilestone: true,
      showVariance: true
    },
    
    configSchema: {
      includeChart: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Include Budget Chart',
        description: 'Show visual budget breakdown',
        default: true
      },
      showPMOvsDelivery: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Show PMO vs Delivery Split',
        description: 'Break down spend by PMO and delivery resources',
        default: true
      },
      showByMilestone: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Show Spend by Milestone',
        description: 'Display spend breakdown per milestone',
        default: true
      },
      showVariance: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Show Variance Analysis',
        description: 'Compare budget vs actual with variance',
        default: true
      }
    }
  },

  [SECTION_TYPE.RAID_SUMMARY]: {
    type: SECTION_TYPE.RAID_SUMMARY,
    name: 'RAID Summary',
    description: 'Risks, Assumptions, Issues, and Dependencies overview',
    icon: AlertTriangle,
    category: SECTION_CATEGORY.BACKWARD,
    dataSource: DATA_SOURCE.RAID_SERVICE,
    dataMethod: 'getSummary',
    
    defaultConfig: {
      categories: ['Risk', 'Assumption', 'Issue', 'Dependency'],
      statusFilter: ['Open', 'In Progress'],
      severityFilter: ['all'],
      includeChart: true,
      showDetails: true,
      maxItems: 10
    },
    
    configSchema: {
      categories: {
        type: CONFIG_FIELD_TYPE.MULTI_SELECT,
        label: 'RAID Categories',
        description: 'Which categories to include',
        options: [
          { value: 'Risk', label: 'Risks' },
          { value: 'Assumption', label: 'Assumptions' },
          { value: 'Issue', label: 'Issues' },
          { value: 'Dependency', label: 'Dependencies' }
        ],
        default: ['Risk', 'Assumption', 'Issue', 'Dependency']
      },
      statusFilter: {
        type: CONFIG_FIELD_TYPE.MULTI_SELECT,
        label: 'Status Filter',
        options: [
          { value: 'Open', label: 'Open' },
          { value: 'In Progress', label: 'In Progress' },
          { value: 'Closed', label: 'Closed' },
          { value: 'Accepted', label: 'Accepted' },
          { value: 'Mitigated', label: 'Mitigated' }
        ],
        default: ['Open', 'In Progress']
      },
      severityFilter: {
        type: CONFIG_FIELD_TYPE.MULTI_SELECT,
        label: 'Severity Filter',
        options: [
          { value: 'all', label: 'All Severities' },
          { value: 'High', label: 'High' },
          { value: 'Medium', label: 'Medium' },
          { value: 'Low', label: 'Low' }
        ],
        default: ['all']
      },
      includeChart: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Include RAID Chart',
        description: 'Show visual RAID summary',
        default: true
      },
      showDetails: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Show Item Details',
        description: 'Include description and owner for each item',
        default: true
      },
      maxItems: {
        type: CONFIG_FIELD_TYPE.NUMBER,
        label: 'Maximum Items',
        description: 'Limit number of items shown (0 for all)',
        default: 10,
        min: 0,
        max: 100
      }
    }
  },

  [SECTION_TYPE.TIMESHEET_SUMMARY]: {
    type: SECTION_TYPE.TIMESHEET_SUMMARY,
    name: 'Timesheet Summary',
    description: 'Time tracking summary and resource utilisation',
    icon: Clock,
    category: SECTION_CATEGORY.BACKWARD,
    dataSource: DATA_SOURCE.METRICS_SERVICE,
    dataMethod: 'getTimesheetMetrics',
    roleRestriction: ['admin', 'supplier_pm'],
    
    defaultConfig: {
      includeChart: true,
      showByResource: true,
      showByMilestone: true,
      statusFilter: ['Submitted', 'Validated', 'Approved']
    },
    
    configSchema: {
      includeChart: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Include Hours Chart',
        description: 'Show visual timesheet breakdown',
        default: true
      },
      showByResource: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Show Hours by Resource',
        description: 'Break down hours per resource',
        default: true
      },
      showByMilestone: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Show Hours by Milestone',
        description: 'Break down hours per milestone',
        default: true
      },
      statusFilter: {
        type: CONFIG_FIELD_TYPE.MULTI_SELECT,
        label: 'Status Filter',
        options: [
          { value: 'Draft', label: 'Draft' },
          { value: 'Submitted', label: 'Submitted' },
          { value: 'Validated', label: 'Validated' },
          { value: 'Approved', label: 'Approved' }
        ],
        default: ['Submitted', 'Validated', 'Approved']
      }
    }
  },

  [SECTION_TYPE.EXPENSE_SUMMARY]: {
    type: SECTION_TYPE.EXPENSE_SUMMARY,
    name: 'Expense Summary',
    description: 'Expense breakdown by category and chargeable status',
    icon: Receipt,
    category: SECTION_CATEGORY.BACKWARD,
    dataSource: DATA_SOURCE.METRICS_SERVICE,
    dataMethod: 'getExpenseMetrics',
    roleRestriction: ['admin', 'supplier_pm'],
    
    defaultConfig: {
      includeChart: true,
      showByCategory: true,
      showChargeableBreakdown: true,
      statusFilter: ['Submitted', 'Approved', 'Paid']
    },
    
    configSchema: {
      includeChart: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Include Expense Chart',
        description: 'Show visual expense breakdown',
        default: true
      },
      showByCategory: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Show by Category',
        description: 'Break down expenses by category',
        default: true
      },
      showChargeableBreakdown: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Show Chargeable Split',
        description: 'Separate chargeable and non-chargeable',
        default: true
      },
      statusFilter: {
        type: CONFIG_FIELD_TYPE.MULTI_SELECT,
        label: 'Status Filter',
        options: [
          { value: 'Draft', label: 'Draft' },
          { value: 'Submitted', label: 'Submitted' },
          { value: 'Approved', label: 'Approved' },
          { value: 'Paid', label: 'Paid' }
        ],
        default: ['Submitted', 'Approved', 'Paid']
      }
    }
  },

  // --------------------------------------------------------
  // FORWARD-LOOKING SECTIONS
  // --------------------------------------------------------

  [SECTION_TYPE.FORWARD_LOOK]: {
    type: SECTION_TYPE.FORWARD_LOOK,
    name: 'Forward Look',
    description: 'Combined view of upcoming milestones, deliverables, and dependencies',
    icon: CalendarClock,
    category: SECTION_CATEGORY.FORWARD,
    dataSource: DATA_SOURCE.CUSTOM_QUERY,
    
    defaultConfig: {
      lookAheadPeriod: '3months',
      includeMilestones: true,
      includeDeliverables: true,
      includeDependencies: true,
      includeResources: false
    },
    
    configSchema: {
      lookAheadPeriod: {
        type: CONFIG_FIELD_TYPE.SELECT,
        label: 'Look-Ahead Period',
        description: 'How far ahead to look',
        options: [
          { value: '1month', label: 'Next Month' },
          { value: '3months', label: 'Next 3 Months' },
          { value: '6months', label: 'Next 6 Months' },
          { value: 'custom', label: 'Custom Period' }
        ],
        default: '3months'
      },
      includeMilestones: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Include Milestones',
        description: 'Show upcoming milestones',
        default: true
      },
      includeDeliverables: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Include Deliverables',
        description: 'Show upcoming deliverables',
        default: true
      },
      includeDependencies: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Include Dependencies',
        description: 'Show blocking dependencies',
        default: true
      },
      includeResources: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Include Resource Requirements',
        description: 'Show resource allocation needs',
        default: false
      }
    }
  },

  [SECTION_TYPE.UPCOMING_MILESTONES]: {
    type: SECTION_TYPE.UPCOMING_MILESTONES,
    name: 'Upcoming Milestones',
    description: 'Milestones scheduled for completion in the upcoming period',
    icon: Target,
    category: SECTION_CATEGORY.FORWARD,
    dataSource: DATA_SOURCE.CUSTOM_QUERY,
    
    defaultConfig: {
      lookAheadPeriod: '3months',
      includeInProgress: true,
      showDependencies: false
    },
    
    configSchema: {
      lookAheadPeriod: {
        type: CONFIG_FIELD_TYPE.SELECT,
        label: 'Look-Ahead Period',
        options: [
          { value: '1month', label: 'Next Month' },
          { value: '3months', label: 'Next 3 Months' },
          { value: '6months', label: 'Next 6 Months' }
        ],
        default: '3months'
      },
      includeInProgress: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Include In Progress',
        description: 'Include milestones already in progress',
        default: true
      },
      showDependencies: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Show Dependencies',
        description: 'Display related dependencies',
        default: false
      }
    }
  },

  [SECTION_TYPE.UPCOMING_DELIVERABLES]: {
    type: SECTION_TYPE.UPCOMING_DELIVERABLES,
    name: 'Upcoming Deliverables',
    description: 'Deliverables due in the upcoming period',
    icon: CheckSquare,
    category: SECTION_CATEGORY.FORWARD,
    dataSource: DATA_SOURCE.CUSTOM_QUERY,
    
    defaultConfig: {
      lookAheadPeriod: '1month',
      groupByMilestone: true,
      highlightOverdue: true
    },
    
    configSchema: {
      lookAheadPeriod: {
        type: CONFIG_FIELD_TYPE.SELECT,
        label: 'Look-Ahead Period',
        options: [
          { value: '1week', label: 'Next Week' },
          { value: '2weeks', label: 'Next 2 Weeks' },
          { value: '1month', label: 'Next Month' },
          { value: '3months', label: 'Next 3 Months' }
        ],
        default: '1month'
      },
      groupByMilestone: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Group by Milestone',
        description: 'Organise by parent milestone',
        default: true
      },
      highlightOverdue: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Highlight Overdue',
        description: 'Emphasise overdue deliverables',
        default: true
      }
    }
  },

  // --------------------------------------------------------
  // CONTENT SECTIONS
  // --------------------------------------------------------

  [SECTION_TYPE.EXECUTIVE_SUMMARY]: {
    type: SECTION_TYPE.EXECUTIVE_SUMMARY,
    name: 'Executive Summary',
    description: 'High-level project summary (AI-assisted or manual)',
    icon: FileText,
    category: SECTION_CATEGORY.CONTENT,
    dataSource: DATA_SOURCE.AI_GENERATED,
    
    defaultConfig: {
      autoGenerate: false,
      maxLength: 500,
      tone: 'professional',
      includeHighlights: true,
      includeChallenges: true,
      includeNextSteps: true,
      content: ''
    },
    
    configSchema: {
      autoGenerate: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'AI-Generate Summary',
        description: 'Let AI create the summary based on report data',
        default: false
      },
      content: {
        type: CONFIG_FIELD_TYPE.TEXTAREA,
        label: 'Summary Content',
        description: 'Write or edit the executive summary',
        placeholder: 'Enter executive summary or use AI to generate...',
        rows: 8,
        aiAssist: true,
        showWhen: { autoGenerate: false }
      },
      tone: {
        type: CONFIG_FIELD_TYPE.SELECT,
        label: 'Tone',
        description: 'Writing style for AI generation',
        options: [
          { value: 'professional', label: 'Professional' },
          { value: 'concise', label: 'Concise & Direct' },
          { value: 'detailed', label: 'Detailed & Thorough' }
        ],
        default: 'professional',
        showWhen: { autoGenerate: true }
      },
      maxLength: {
        type: CONFIG_FIELD_TYPE.NUMBER,
        label: 'Maximum Words',
        description: 'Target word count for AI summary',
        default: 500,
        min: 100,
        max: 2000,
        showWhen: { autoGenerate: true }
      },
      includeHighlights: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Include Highlights',
        description: 'Mention key achievements',
        default: true,
        showWhen: { autoGenerate: true }
      },
      includeChallenges: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Include Challenges',
        description: 'Address issues and blockers',
        default: true,
        showWhen: { autoGenerate: true }
      },
      includeNextSteps: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Include Next Steps',
        description: 'Outline upcoming priorities',
        default: true,
        showWhen: { autoGenerate: true }
      }
    }
  },

  [SECTION_TYPE.LESSONS_LEARNED]: {
    type: SECTION_TYPE.LESSONS_LEARNED,
    name: 'Lessons Learned',
    description: 'Key learnings and recommendations from the reporting period',
    icon: BookOpen,
    category: SECTION_CATEGORY.CONTENT,
    dataSource: DATA_SOURCE.USER_INPUT,
    
    defaultConfig: {
      format: 'structured',
      categories: ['Process', 'Technical', 'Communication', 'Resource'],
      content: [],
      aiSuggest: false
    },
    
    configSchema: {
      format: {
        type: CONFIG_FIELD_TYPE.SELECT,
        label: 'Format',
        options: [
          { value: 'structured', label: 'Structured (Category + Lesson + Recommendation)' },
          { value: 'freeform', label: 'Free-form Text' }
        ],
        default: 'structured'
      },
      content: {
        type: CONFIG_FIELD_TYPE.TEXTAREA,
        label: 'Lessons Learned Content',
        description: 'Enter lessons learned or use AI to help identify them',
        placeholder: 'Enter lessons learned...',
        rows: 10,
        aiAssist: true,
        showWhen: { format: 'freeform' }
      },
      aiSuggest: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'AI Suggestions',
        description: 'Get AI suggestions based on project data',
        default: false
      }
    }
  },

  [SECTION_TYPE.CUSTOM_TEXT]: {
    type: SECTION_TYPE.CUSTOM_TEXT,
    name: 'Custom Section',
    description: 'Add custom content with your own heading and text',
    icon: PenLine,
    category: SECTION_CATEGORY.CONTENT,
    dataSource: DATA_SOURCE.USER_INPUT,
    
    defaultConfig: {
      heading: 'Custom Section',
      content: '',
      headingLevel: 2
    },
    
    configSchema: {
      heading: {
        type: CONFIG_FIELD_TYPE.TEXT,
        label: 'Section Heading',
        description: 'Title for this section',
        placeholder: 'Enter section heading...',
        default: 'Custom Section'
      },
      headingLevel: {
        type: CONFIG_FIELD_TYPE.SELECT,
        label: 'Heading Level',
        options: [
          { value: 2, label: 'Heading 2 (Standard)' },
          { value: 3, label: 'Heading 3 (Subsection)' },
          { value: 4, label: 'Heading 4 (Minor)' }
        ],
        default: 2
      },
      content: {
        type: CONFIG_FIELD_TYPE.TEXTAREA,
        label: 'Content',
        description: 'Section content (supports basic formatting)',
        placeholder: 'Enter section content...',
        rows: 10,
        aiAssist: true
      }
    }
  },

  [SECTION_TYPE.RESOURCE_SUMMARY]: {
    type: SECTION_TYPE.RESOURCE_SUMMARY,
    name: 'Resource Summary',
    description: 'Team composition and resource allocation overview',
    icon: Users,
    category: SECTION_CATEGORY.CONTENT,
    dataSource: DATA_SOURCE.METRICS_SERVICE,
    dataMethod: 'getResourceMetrics',
    roleRestriction: ['admin', 'supplier_pm'],
    
    defaultConfig: {
      includeChart: true,
      showAllocation: true,
      showUtilisation: true,
      groupByRole: true
    },
    
    configSchema: {
      includeChart: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Include Resource Chart',
        description: 'Show visual resource breakdown',
        default: true
      },
      showAllocation: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Show Allocation',
        description: 'Display days allocated per resource',
        default: true
      },
      showUtilisation: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Show Utilisation',
        description: 'Display utilisation percentage',
        default: true
      },
      groupByRole: {
        type: CONFIG_FIELD_TYPE.BOOLEAN,
        label: 'Group by Role',
        description: 'Organise resources by role type',
        default: true
      }
    }
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get all section types as an array
 * @returns {Array} Array of section type configurations
 */
export function getAllSectionTypes() {
  return Object.values(SECTION_TYPE_CONFIG);
}

/**
 * Get section type configuration by type
 * @param {string} type - Section type identifier
 * @returns {Object|null} Section type configuration or null if not found
 */
export function getSectionTypeConfig(type) {
  return SECTION_TYPE_CONFIG[type] || null;
}

/**
 * Get section types grouped by category
 * @returns {Object} Section types grouped by category key
 */
export function getSectionTypesByCategory() {
  const grouped = {
    [SECTION_CATEGORY.BACKWARD]: [],
    [SECTION_CATEGORY.FORWARD]: [],
    [SECTION_CATEGORY.CONTENT]: []
  };

  Object.values(SECTION_TYPE_CONFIG).forEach(config => {
    if (grouped[config.category]) {
      grouped[config.category].push(config);
    }
  });

  return grouped;
}

/**
 * Get section types available for a specific user role
 * @param {string} userRole - User role (admin, supplier_pm, customer_pm, etc.)
 * @returns {Array} Array of section type configurations available to the role
 */
export function getSectionTypesForRole(userRole) {
  return Object.values(SECTION_TYPE_CONFIG).filter(config => {
    // If no role restriction, available to all
    if (!config.roleRestriction) return true;
    // Check if user role is in allowed list
    return config.roleRestriction.includes(userRole);
  });
}

/**
 * Get section types by category for a specific user role
 * @param {string} userRole - User role
 * @returns {Object} Section types grouped by category, filtered by role
 */
export function getSectionTypesByCategoryForRole(userRole) {
  const allByCategory = getSectionTypesByCategory();
  const result = {};

  Object.entries(allByCategory).forEach(([category, sections]) => {
    result[category] = sections.filter(config => {
      if (!config.roleRestriction) return true;
      return config.roleRestriction.includes(userRole);
    });
  });

  return result;
}

/**
 * Get category configuration
 * @param {string} category - Category key
 * @returns {Object|null} Category configuration or null
 */
export function getCategoryConfig(category) {
  return SECTION_CATEGORY_CONFIG[category] || null;
}

/**
 * Get all categories with their configurations
 * @returns {Array} Array of category configurations with key
 */
export function getAllCategories() {
  return Object.entries(SECTION_CATEGORY_CONFIG)
    .map(([key, config]) => ({ key, ...config }))
    .sort((a, b) => a.order - b.order);
}

/**
 * Create a new section instance from a section type
 * @param {string} type - Section type identifier
 * @param {Object} overrides - Optional config overrides
 * @returns {Object} New section instance with unique ID
 */
export function createSectionInstance(type, overrides = {}) {
  const config = getSectionTypeConfig(type);
  if (!config) {
    throw new Error(`Unknown section type: ${type}`);
  }

  return {
    id: `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: config.type,
    name: config.name,
    config: {
      ...config.defaultConfig,
      ...overrides
    }
  };
}

/**
 * Validate a section's configuration against its schema
 * @param {Object} section - Section instance to validate
 * @returns {Object} Validation result { valid: boolean, errors: Array }
 */
export function validateSectionConfig(section) {
  const typeConfig = getSectionTypeConfig(section.type);
  if (!typeConfig) {
    return { valid: false, errors: ['Unknown section type'] };
  }

  const errors = [];
  const schema = typeConfig.configSchema;

  // Check required fields and validate types
  Object.entries(schema).forEach(([fieldName, fieldConfig]) => {
    const value = section.config?.[fieldName];

    // Check if field should be visible based on showWhen condition
    if (fieldConfig.showWhen) {
      const showWhenKey = Object.keys(fieldConfig.showWhen)[0];
      const showWhenValue = fieldConfig.showWhen[showWhenKey];
      if (section.config?.[showWhenKey] !== showWhenValue) {
        return; // Skip validation for hidden fields
      }
    }

    // Validate based on field type
    switch (fieldConfig.type) {
      case CONFIG_FIELD_TYPE.NUMBER:
        if (value !== undefined && value !== null) {
          if (typeof value !== 'number') {
            errors.push(`${fieldConfig.label} must be a number`);
          } else {
            if (fieldConfig.min !== undefined && value < fieldConfig.min) {
              errors.push(`${fieldConfig.label} must be at least ${fieldConfig.min}`);
            }
            if (fieldConfig.max !== undefined && value > fieldConfig.max) {
              errors.push(`${fieldConfig.label} must be at most ${fieldConfig.max}`);
            }
          }
        }
        break;

      case CONFIG_FIELD_TYPE.SELECT:
        if (value !== undefined && value !== null) {
          const validValues = fieldConfig.options.map(opt => opt.value);
          if (!validValues.includes(value)) {
            errors.push(`${fieldConfig.label} has an invalid value`);
          }
        }
        break;

      case CONFIG_FIELD_TYPE.MULTI_SELECT:
        if (value !== undefined && Array.isArray(value)) {
          const validValues = fieldConfig.options.map(opt => opt.value);
          value.forEach(v => {
            if (!validValues.includes(v)) {
              errors.push(`${fieldConfig.label} contains an invalid value: ${v}`);
            }
          });
        }
        break;

      default:
        // Other types don't have strict validation
        break;
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get the default config for a section type
 * @param {string} type - Section type identifier
 * @returns {Object} Default configuration
 */
export function getDefaultConfig(type) {
  const config = getSectionTypeConfig(type);
  return config?.defaultConfig || {};
}

/**
 * Filter config fields based on role restrictions
 * @param {Object} configSchema - Section type config schema
 * @param {string} userRole - User role
 * @returns {Object} Filtered config schema
 */
export function filterConfigSchemaForRole(configSchema, userRole) {
  const filtered = {};
  
  Object.entries(configSchema).forEach(([fieldName, fieldConfig]) => {
    if (!fieldConfig.roleRestriction || fieldConfig.roleRestriction.includes(userRole)) {
      filtered[fieldName] = fieldConfig;
    }
  });

  return filtered;
}

// ============================================
// EXPORTS
// ============================================

export default {
  SECTION_TYPE,
  SECTION_CATEGORY,
  SECTION_CATEGORY_CONFIG,
  DATA_SOURCE,
  CONFIG_FIELD_TYPE,
  SECTION_TYPE_CONFIG,
  getAllSectionTypes,
  getSectionTypeConfig,
  getSectionTypesByCategory,
  getSectionTypesForRole,
  getSectionTypesByCategoryForRole,
  getCategoryConfig,
  getAllCategories,
  createSectionInstance,
  validateSectionConfig,
  getDefaultConfig,
  filterConfigSchemaForRole
};
