/**
 * Help Content Index
 * 
 * Centralised help content for all pages in the application.
 * Each page has its own content object with title, sections, and tips.
 * 
 * @version 1.0
 * @created 6 December 2025
 */

// Icons used in help content
import { 
  LayoutDashboard, Flag, Package, Users, Clock, Receipt,
  Building2, Target, Award, AlertTriangle, UserCog,
  CheckCircle, Send, RotateCcw, PenTool, FileText
} from 'lucide-react';

/**
 * Help content structure:
 * {
 *   title: string,
 *   icon: Component,
 *   description: string,
 *   sections: [
 *     {
 *       heading: string,
 *       content: string | string[],
 *       type?: 'text' | 'list' | 'table'
 *     }
 *   ],
 *   tips: string[],
 *   relatedTopics: string[]
 * }
 */

export const helpContent = {
  // Dashboard
  dashboard: {
    title: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Your command centre showing project KPIs, financial metrics, and progress at a glance.',
    sections: [
      {
        heading: 'Available Widgets',
        type: 'list',
        content: [
          'Project Progress - Overall completion ring',
          'Budget Summary - Spend vs budget',
          'PMO Tracking - Cost breakdown',
          'Key Statistics - Counts and metrics',
          'Timesheets - Hours submitted and validated',
          'Expenses - Amounts awaiting validation',
          'Milestones List - All milestones with progress'
        ]
      },
      {
        heading: 'Customising Your Dashboard',
        type: 'list',
        content: [
          'Click "Customise" in the top-right corner',
          'Drag widgets to rearrange them',
          'Resize widgets from their corners',
          'Your layout saves automatically',
          'Click "Reset to Default" to restore'
        ]
      }
    ],
    tips: [
      'Your dashboard layout is saved to your account',
      'Widgets update automatically as data changes'
    ],
    relatedTopics: ['milestones', 'timesheets', 'expenses']
  },

  // Milestones
  milestones: {
    title: 'Milestones',
    icon: Flag,
    description: 'Milestones are the primary billing units. Each represents a major project phase that triggers payment when complete.',
    sections: [
      {
        heading: 'Milestone Status',
        type: 'list',
        content: [
          'Not Started - Work has not begun (0%)',
          'In Progress - Work is underway (1-99%)',
          'Completed - All work finished (100%)'
        ]
      },
      {
        heading: 'Financial Structure',
        type: 'list',
        content: [
          'Baseline - Original contracted amount (locked after commitment)',
          'Forecast - Current projected amount (can be updated)',
          'Actual - Final billable amount (set at delivery)'
        ]
      },
      {
        heading: 'Certificate Badges',
        type: 'list',
        content: [
          '✓ Both Signed - Ready for billing',
          'Awaiting Customer - Supplier has signed',
          'Awaiting Supplier - Customer has signed',
          'Pending - Certificate exists, no signatures',
          '– - No certificate yet'
        ]
      }
    ],
    tips: [
      'Progress is automatically calculated from deliverables',
      'Click any row to view full milestone details',
      'Both parties must sign before baseline is locked'
    ],
    relatedTopics: ['milestoneDetail', 'deliverables']
  },

  // Milestone Detail
  milestoneDetail: {
    title: 'Milestone Detail',
    icon: Flag,
    description: 'View and manage individual milestone details, baseline commitment, and acceptance certificates.',
    sections: [
      {
        heading: 'Baseline Commitment',
        type: 'text',
        content: 'Before work begins, both Supplier PM and Customer PM must sign to lock the baseline schedule and budget. This creates a formal agreement on the original contract terms.'
      },
      {
        heading: 'Signing Process',
        type: 'list',
        content: [
          'Either party can sign first',
          'Click "Sign as Supplier PM" or "Sign as Customer PM"',
          'Once both sign, baseline values are locked',
          'Locked baselines cannot be changed'
        ]
      },
      {
        heading: 'Acceptance Certificates',
        type: 'text',
        content: 'When milestone reaches 100%, create a certificate for formal acceptance. Supplier signs to confirm delivery, Customer signs to authorise billing.'
      }
    ],
    tips: [
      'Create the certificate only when all deliverables are complete',
      'The Supplier PM should sign first to confirm delivery',
      'Once both sign, the milestone is ready for invoicing'
    ],
    relatedTopics: ['milestones', 'deliverables']
  },

  // Deliverables
  deliverables: {
    title: 'Deliverables',
    icon: Package,
    description: 'Deliverables are work-level items that contribute to milestone completion. Each is a discrete output like a document, feature, or component.',
    sections: [
      {
        heading: 'Workflow Status',
        type: 'list',
        content: [
          'Not Started - Work has not begun',
          'In Progress - Active work underway',
          'Submitted for Review - Ready for customer review',
          'Returned for More Work - Changes requested',
          'Review Complete - Approved, ready for sign-off',
          'Delivered - Formally accepted'
        ]
      },
      {
        heading: 'Status Transitions',
        type: 'list',
        content: [
          'Progress 0% → automatically sets "Not Started"',
          'Progress 1-99% → automatically sets "In Progress"',
          '"Submit for Review" → sends to customer',
          'Customer accepts → "Review Complete"',
          'Both PMs sign → "Delivered"'
        ]
      }
    ],
    tips: [
      'Filter by milestone or status using the dropdowns',
      'Click "Awaiting Review" badge to see items needing review',
      'Due dates are derived from the parent milestone'
    ],
    relatedTopics: ['milestones', 'kpis', 'qualityStandards']
  },

  // Deliverable Detail (modal)
  deliverableDetail: {
    title: 'Deliverable Detail',
    icon: Package,
    description: 'View and manage individual deliverables, submit for review, and complete the delivery sign-off process.',
    sections: [
      {
        heading: 'Review Process',
        type: 'list',
        content: [
          'Complete work and set progress to 100%',
          'Click "Submit for Review"',
          'Customer PM reviews the work',
          'Customer clicks "Accept Review" or "Return for More Work"'
        ]
      },
      {
        heading: 'Delivery Sign-off',
        type: 'text',
        content: 'Once review is complete, both PMs must sign to formally accept the deliverable. This dual-signature ensures both parties agree the work is done.'
      },
      {
        heading: 'KPI & Quality Assessment',
        type: 'text',
        content: 'When marking as delivered, you may need to assess linked KPIs and Quality Standards. For each, indicate whether the criteria were met.'
      }
    ],
    tips: [
      'The Supplier PM should sign first',
      'Once both sign, the deliverable is marked as Delivered',
      'Delivered items contribute to milestone progress'
    ],
    relatedTopics: ['deliverables', 'milestones']
  },

  // Resources
  resources: {
    title: 'Resources',
    icon: Users,
    description: 'Manage team members, their allocations, and track utilisation across the project.',
    sections: [
      {
        heading: 'Resource Information',
        type: 'list',
        content: [
          'Name and contact details',
          'Role and partner organisation',
          'Day rate and billing information',
          'Allocation to milestones',
          'Utilisation percentage'
        ]
      },
      {
        heading: 'Utilisation',
        type: 'text',
        content: 'Utilisation shows how much of a resource\'s allocated time has been logged. The progress bar fills based on timesheets submitted.'
      }
    ],
    tips: [
      'Click any row to view the full resource detail',
      'Resources can be linked to user accounts for self-service',
      'Filter by type (PMO, Delivery, etc.) using the dropdown'
    ],
    relatedTopics: ['timesheets', 'partners']
  },

  // Timesheets
  timesheets: {
    title: 'Timesheets',
    icon: Clock,
    description: 'Track time worked by team members. Submit timesheets for validation and approval.',
    sections: [
      {
        heading: 'Status Flow',
        type: 'list',
        content: [
          'Draft - Saved but not submitted',
          'Submitted - Awaiting validation by PM',
          'Validated - Approved, ready for invoicing',
          'Rejected - Returned with comments'
        ]
      },
      {
        heading: 'Filtering Options',
        type: 'list',
        content: [
          'Quick Select: This Week, Last Week, This Month, Last Month',
          'Month/Year: Select a specific month',
          'Custom Range: Set specific dates',
          'Status: Filter by workflow status'
        ]
      }
    ],
    tips: [
      'Use the date filters to find timesheets quickly',
      'Click any row to open the validation modal',
      'Validated timesheets appear on partner invoices'
    ],
    relatedTopics: ['resources', 'partners']
  },

  // Expenses
  expenses: {
    title: 'Expenses',
    icon: Receipt,
    description: 'Track and validate expense claims. Mark expenses as chargeable to pass through to customer invoices.',
    sections: [
      {
        heading: 'Categories',
        type: 'list',
        content: [
          'Travel - Flights, trains, taxis, mileage',
          'Accommodation - Hotels, rentals',
          'Sustenance - Meals during work',
          'Equipment - Hardware, software, tools',
          'Materials - Supplies, consumables',
          'Other - Miscellaneous items'
        ]
      },
      {
        heading: 'Chargeable Expenses',
        type: 'text',
        content: 'Mark an expense as "Chargeable to Customer" if it should be passed through on invoices. Non-chargeable expenses are internal costs.'
      },
      {
        heading: 'AI Receipt Scanning',
        type: 'text',
        content: 'Upload a receipt image and AI will extract the date, amount, category, and description automatically. Review and adjust before saving.'
      }
    ],
    tips: [
      'Use receipt scanning to save time on data entry',
      'Attach receipt images for audit trail',
      'Chargeable expenses appear on customer invoices'
    ],
    relatedTopics: ['timesheets', 'partners']
  },

  // Partners
  partners: {
    title: 'Partners',
    icon: Building2,
    description: 'Manage partner organisations and generate invoices for their work.',
    sections: [
      {
        heading: 'Partner Information',
        type: 'list',
        content: [
          'Contact details and status',
          'Linked resources (team members)',
          'Timesheet history',
          'Expense history'
        ]
      },
      {
        heading: 'Invoice Generation',
        type: 'list',
        content: [
          'Select the billing period (month or custom range)',
          'Click "Generate Invoice"',
          'Review the breakdown: Timesheets + Expenses',
          'Save as PDF using your browser\'s print function'
        ]
      }
    ],
    tips: [
      'Toggle partner status inline without opening the detail page',
      'Only validated timesheets appear on invoices',
      'Non-chargeable expenses are shown separately'
    ],
    relatedTopics: ['resources', 'timesheets', 'expenses']
  },

  // KPIs
  kpis: {
    title: 'Key Performance Indicators',
    icon: Target,
    description: 'Track and measure project performance against defined KPIs.',
    sections: [
      {
        heading: 'KPI Information',
        type: 'list',
        content: [
          'Reference and name',
          'Category grouping',
          'Target and current values',
          'Status (On Track, At Risk, Behind)'
        ]
      },
      {
        heading: 'Linking to Deliverables',
        type: 'text',
        content: 'KPIs can be linked to deliverables. When a deliverable is marked as delivered, you assess whether linked KPIs were met.'
      }
    ],
    tips: [
      'Click any row to view full KPI details',
      'Link KPIs to deliverables for tracking',
      'Filter by category using the dropdown'
    ],
    relatedTopics: ['deliverables', 'qualityStandards']
  },

  // Quality Standards
  qualityStandards: {
    title: 'Quality Standards',
    icon: Award,
    description: 'Define and track quality standards that deliverables must meet.',
    sections: [
      {
        heading: 'Quality Standard Information',
        type: 'list',
        content: [
          'Reference and name',
          'Category grouping',
          'Description of criteria',
          'Status tracking'
        ]
      },
      {
        heading: 'Linking to Deliverables',
        type: 'text',
        content: 'Quality Standards can be linked to deliverables. When a deliverable is delivered, you assess whether each standard was met.'
      }
    ],
    tips: [
      'Link Quality Standards when creating deliverables',
      'Assessment results are recorded for audit',
      'Use consistent naming for easier tracking'
    ],
    relatedTopics: ['deliverables', 'kpis']
  },

  // RAID Log
  raidLog: {
    title: 'RAID Log',
    icon: AlertTriangle,
    description: 'Track Risks, Assumptions, Issues, and Dependencies for the project.',
    sections: [
      {
        heading: 'RAID Types',
        type: 'list',
        content: [
          'Risks - Potential problems that may occur',
          'Assumptions - Things assumed to be true',
          'Issues - Current problems being addressed',
          'Dependencies - External factors affecting the project'
        ]
      },
      {
        heading: 'Priority Levels',
        type: 'list',
        content: [
          'Critical - Immediate attention required',
          'High - Address soon',
          'Medium - Monitor and plan',
          'Low - Track for awareness'
        ]
      }
    ],
    tips: [
      'Use tabs to switch between Risks and Issues',
      'Keep RAID items updated regularly',
      'Close items when resolved'
    ],
    relatedTopics: ['milestones', 'deliverables']
  },

  // Users
  users: {
    title: 'User Administration',
    icon: UserCog,
    description: 'Manage user accounts, roles, and resource links. Admin access required.',
    sections: [
      {
        heading: 'User Roles',
        type: 'list',
        content: [
          'Admin - Full system access',
          'Supplier PM - Manages delivery, validates work',
          'Customer PM - Reviews deliverables, validates work',
          'Contributor - Submits timesheets and expenses',
          'Viewer - Read-only access'
        ]
      },
      {
        heading: 'Changing Roles',
        type: 'text',
        content: 'Click the role badge on any user row to change their role. Changes save automatically.'
      },
      {
        heading: 'Linking Resources',
        type: 'text',
        content: 'Link users to resources so they can submit timesheets and expenses. Click "Link resource" in the user row.'
      }
    ],
    tips: [
      'Test users can be toggled visible/hidden',
      'Users need a linked resource to submit timesheets',
      'Role changes take effect immediately'
    ],
    relatedTopics: ['resources', 'timesheets']
  },

  // General/Default
  general: {
    title: 'Getting Help',
    icon: FileText,
    description: 'Welcome to AMSF001 Project Tracker. Here are some tips to get started.',
    sections: [
      {
        heading: 'Navigation',
        type: 'list',
        content: [
          'Use the left menu to navigate between sections',
          'Click any table row to view details',
          'Use filter dropdowns to find specific items',
          'The AI Chat assistant can answer questions'
        ]
      },
      {
        heading: 'Common Actions',
        type: 'list',
        content: [
          'Create items using the "+ Add" buttons',
          'Edit items from their detail pages',
          'Submit work for validation using workflow buttons',
          'Sign documents when both parties are ready'
        ]
      }
    ],
    tips: [
      'Press ? on any page to open this help panel',
      'Ask the AI Chat assistant for specific information',
      'Contact your administrator if you need role changes'
    ],
    relatedTopics: ['dashboard', 'milestones', 'deliverables']
  }
};

/**
 * Get help content for a specific page
 * @param {string} pageKey - The page identifier
 * @returns {object} Help content for the page
 */
export function getHelpContent(pageKey) {
  return helpContent[pageKey] || helpContent.general;
}

/**
 * Get all available help topics
 * @returns {string[]} Array of topic keys
 */
export function getAllHelpTopics() {
  return Object.keys(helpContent);
}

export default helpContent;
