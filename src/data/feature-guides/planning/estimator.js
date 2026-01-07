// Estimator Feature Guide
// Complete how-to documentation for cost estimation functionality

const estimatorGuide = {
  id: 'estimator',
  title: 'Cost Estimator',
  category: 'planning',
  description: 'Create detailed cost estimates for project work using SFIA 8 skills framework. Allocate resources by skill and level, apply day rates from benchmarks, and calculate total project costs across monthly periods.',
  
  navigation: {
    path: '/estimate',
    sidebar: 'Planning → Estimator',
    quickAccess: 'Dashboard → Project Budget widget → "View Estimate"',
    breadcrumb: 'Home > Planning > Estimator'
  },
  
  howTo: {
    create: {
      title: 'Creating a New Estimate',
      steps: [
        'Navigate to the Estimator page from the sidebar (Planning → Estimator)',
        'Click "New Estimate" button in the toolbar',
        'Enter an estimate name (e.g., "Phase 1 Development Estimate")',
        'Select the estimate type: Fixed Price, Time & Materials, or Blended',
        'Choose which plan items this estimate covers (milestones/deliverables)',
        'Set the estimate period (start and end months)',
        'Click "Create" to generate the estimate shell',
        'Proceed to add resources and effort allocation'
      ],
      tips: [
        'Link estimates to specific milestones for accurate budget tracking',
        'Create separate estimates for different phases or change requests',
        'The estimate period should match your delivery timeline',
        'You can duplicate existing estimates as a starting point'
      ]
    },
    addResources: {
      title: 'Adding Resources by Skill and Level',
      steps: [
        'Open your estimate from the Estimator page',
        'Click "Add Resource" in the resource panel',
        'Select a SFIA 8 skill from the dropdown (e.g., "Software development")',
        'Select the skill level (1-7) appropriate for the work',
        'Choose the rate tier: Contractor, Prime, Mid, or SME',
        'Optionally specify a named resource if known',
        'Click "Add" to include the resource in the estimate',
        'Repeat for each skill/level combination needed'
      ],
      tips: [
        'Use skill descriptions to determine appropriate levels',
        'Mix different levels for realistic team composition',
        'Higher levels (5-7) should be used sparingly',
        'The rate is automatically populated from benchmarks'
      ],
      sfiaLevels: [
        { level: 1, name: 'Follow', description: 'Works under close direction. Uses little discretion.' },
        { level: 2, name: 'Assist', description: 'Works under routine direction. Uses limited discretion.' },
        { level: 3, name: 'Apply', description: 'Works under general direction. Uses substantial discretion.' },
        { level: 4, name: 'Enable', description: 'Works under general guidance. Has substantial responsibility.' },
        { level: 5, name: 'Ensure/Advise', description: 'Works under broad direction. Full accountability.' },
        { level: 6, name: 'Initiate/Influence', description: 'Has defined authority. Leads significant projects.' },
        { level: 7, name: 'Set Strategy/Inspire', description: 'Sets organisational objectives. Leads business-critical work.' }
      ]
    },
    effortGrid: {
      title: 'Entering Effort in the Monthly Grid',
      steps: [
        'After adding resources, the effort grid displays months as columns',
        'Each row represents one resource (skill/level combination)',
        'Click on a cell to enter the number of days for that month',
        'Enter effort in person-days (e.g., 20 for a full month, 10 for half)',
        'Tab to move to the next cell, or use arrow keys',
        'The system calculates costs automatically based on day rates',
        'Row totals show total days and cost per resource',
        'Column totals show monthly spend'
      ],
      tips: [
        'Consider holidays and availability when planning monthly effort',
        'A typical month has approximately 20-22 working days',
        'Use decimals for partial days (e.g., 15.5 days)',
        'Effort should align with your WBS planning estimates',
        'Costs update in real-time as you enter values'
      ]
    },
    applyRates: {
      title: 'Applying and Adjusting Day Rates',
      steps: [
        'Rates are automatically populated from the benchmarking rate cards',
        'To view rates, hover over the Rate column to see the source',
        'To override a rate, click the rate cell and enter a custom value',
        'Custom rates show a warning indicator for audit purposes',
        'To revert to benchmark rate, click "Reset to Benchmark"',
        'Rate changes affect all months for that resource row',
        'Total cost recalculates automatically'
      ],
      tips: [
        'Rate overrides should be approved and documented',
        'Consider using a different tier instead of custom rates',
        'Blended rates are calculated across the estimate automatically',
        'Export includes rate source for audit trail'
      ]
    },
    linkToPlan: {
      title: 'Linking Estimates to Plan Items',
      steps: [
        'Open the estimate you want to link',
        'Click "Link to Plan" in the toolbar',
        'Select the milestones or deliverables this estimate covers',
        'Check the checkboxes next to items to link',
        'Click "Apply Links" to save',
        'Linked items show the estimate reference in the WBS',
        'Budget allocations flow from estimate to milestone budgets'
      ],
      tips: [
        'An estimate can link to multiple milestones',
        'A milestone can only have one estimate linked',
        'Linking updates the milestone budget automatically',
        'Changes to the estimate update linked milestone budgets'
      ]
    },
    quantityMultipliers: {
      title: 'Using Quantity Multipliers',
      steps: [
        'For work that repeats (e.g., multiple integrations), use multipliers',
        'Click the "×" button next to a resource row',
        'Enter the quantity (e.g., 5 for five similar integrations)',
        'The effort and cost multiply by the quantity',
        'Base effort shows per-unit values, total shows multiplied values',
        'Add notes explaining the quantity for clarity'
      ],
      tips: [
        'Use multipliers for similar repeated work',
        'Better than duplicating rows for the same work',
        'Quantity changes recalculate totals automatically',
        'Document assumptions about the multiplied work'
      ]
    },
    contingency: {
      title: 'Adding Contingency and Risk Allowance',
      steps: [
        'Scroll to the bottom of the estimate grid',
        'Find the "Contingency" section',
        'Enter a contingency percentage (e.g., 15%)',
        'Or enter a fixed contingency amount',
        'The contingency adds to the total estimate',
        'Add notes explaining contingency rationale',
        'Separate contingency lines can be added for different risk areas'
      ],
      tips: [
        'Typical contingency ranges from 10-25% depending on risk',
        'Document assumptions and risks driving contingency',
        'Review and adjust contingency as project progresses',
        'Contingency is visible in budget vs actual reports'
      ]
    },
    view: {
      title: 'Viewing and Analysing Estimates',
      steps: [
        'Navigate to the Estimator page to see all estimates',
        'Use the status filter to show draft, approved, or archived estimates',
        'Click an estimate to open the detail view',
        'Use the Summary tab for high-level cost breakdown',
        'Use the Detail tab for the full effort grid',
        'Use the Analysis tab for charts and comparisons',
        'Export to Excel for offline analysis or sharing'
      ],
      views: [
        { name: 'Summary', description: 'High-level totals by skill category and month' },
        { name: 'Detail', description: 'Full effort grid with all resources and months' },
        { name: 'Analysis', description: 'Charts showing cost distribution and trends' },
        { name: 'Comparison', description: 'Compare multiple estimate versions' }
      ],
      tips: [
        'Use Summary view for stakeholder presentations',
        'Use Detail view for planning and updates',
        'Export includes all views in separate sheets'
      ]
    },
    approve: {
      title: 'Approving Estimates',
      steps: [
        'Review the estimate for completeness and accuracy',
        'Ensure all resources have appropriate rates',
        'Verify effort aligns with WBS planning',
        'Click "Submit for Approval" to change status',
        'Approvers receive a notification',
        'Approver reviews and clicks "Approve" or "Request Changes"',
        'Approved estimates are locked for editing'
      ],
      tips: [
        'Draft estimates can be edited freely',
        'Submitted estimates show as pending approval',
        'Approved estimates require a new version to change',
        'Archive old versions to maintain history'
      ]
    }
  },
  
  fields: {
    estimate_name: {
      name: 'Estimate Name',
      label: 'Name',
      required: true,
      type: 'text',
      description: 'A descriptive name for this estimate',
      validation: 'Required. Maximum 200 characters.',
      tips: 'Include phase or scope reference in the name'
    },
    estimate_type: {
      name: 'Estimate Type',
      label: 'Type',
      required: true,
      type: 'select',
      description: 'The commercial model for this estimate',
      values: ['Fixed Price', 'Time & Materials', 'Blended'],
      validation: 'Required. Affects how totals are presented.',
      tips: 'Type affects reporting and billing calculations'
    },
    status: {
      name: 'Status',
      label: 'Status',
      required: false,
      type: 'readonly',
      description: 'Current status of the estimate',
      values: ['Draft', 'Submitted', 'Approved', 'Archived'],
      tips: 'Status progresses through approval workflow'
    },
    start_month: {
      name: 'Start Month',
      label: 'Start Month',
      required: true,
      type: 'monthpicker',
      description: 'First month covered by this estimate',
      validation: 'Must be within project date range',
      tips: 'Sets the first column in the effort grid'
    },
    end_month: {
      name: 'End Month',
      label: 'End Month',
      required: true,
      type: 'monthpicker',
      description: 'Last month covered by this estimate',
      validation: 'Must be after start month and within project range',
      tips: 'Sets the last column in the effort grid'
    },
    skill: {
      name: 'Skill',
      label: 'SFIA Skill',
      required: true,
      type: 'select',
      description: 'The SFIA 8 skill category for this resource',
      validation: 'Must be a valid SFIA 8 skill',
      tips: 'Search by typing skill name or code'
    },
    level: {
      name: 'Level',
      label: 'Skill Level',
      required: true,
      type: 'select',
      description: 'The SFIA level (1-7) for this resource',
      values: ['1', '2', '3', '4', '5', '6', '7'],
      validation: 'Must be 1-7',
      tips: 'Higher levels have higher rates'
    },
    tier: {
      name: 'Tier',
      label: 'Rate Tier',
      required: true,
      type: 'select',
      description: 'The pricing tier for this resource',
      values: ['Contractor', 'Prime', 'Mid', 'SME'],
      validation: 'Required. Affects day rate lookup.',
      tips: 'Different tiers have different rates for the same skill/level'
    },
    day_rate: {
      name: 'Day Rate',
      label: 'Day Rate (£)',
      required: true,
      type: 'currency',
      description: 'The daily cost for this resource',
      validation: 'Must be positive. Auto-populated from benchmarks.',
      tips: 'Override shows a warning. Hover to see benchmark rate.'
    },
    effort_days: {
      name: 'Effort',
      label: 'Days',
      required: false,
      type: 'number',
      description: 'Person-days of effort for this month',
      validation: 'Must be positive or zero. Decimals allowed.',
      tips: 'Enter days per month. A full month is ~20 days.',
      min: 0,
      step: 0.5
    },
    quantity: {
      name: 'Quantity',
      label: 'Qty',
      required: false,
      type: 'number',
      description: 'Multiplier for repeated work',
      validation: 'Must be positive integer. Default is 1.',
      tips: 'Use for multiple similar items (e.g., 5 integrations)',
      min: 1,
      default: 1
    },
    contingency_percent: {
      name: 'Contingency %',
      label: 'Contingency',
      required: false,
      type: 'percentage',
      description: 'Risk allowance as percentage of total',
      validation: 'Must be 0-100%',
      tips: 'Typical range is 10-25% depending on risk'
    },
    total_cost: {
      name: 'Total Cost',
      label: 'Total (£)',
      required: false,
      type: 'readonly',
      description: 'Calculated total cost including contingency',
      tips: 'Automatically calculated from effort × rate + contingency'
    }
  },
  
  sfia8: {
    title: 'SFIA 8 Skills Framework',
    description: 'The Skills Framework for the Information Age (SFIA) version 8 provides a common reference model for identifying skills. The estimator uses SFIA skills to categorise resources and lookup benchmark rates.',
    categories: [
      {
        code: 'STGY',
        name: 'Strategy and Architecture',
        skills: ['Information strategy', 'Business strategy', 'Enterprise architecture', 'Solution architecture']
      },
      {
        code: 'CHNG',
        name: 'Change and Transformation',
        skills: ['Business change management', 'Programme management', 'Project management', 'Portfolio management']
      },
      {
        code: 'DEV',
        name: 'Development and Implementation',
        skills: ['Software development', 'Systems integration', 'Testing', 'Release management']
      },
      {
        code: 'DLVR',
        name: 'Delivery and Operation',
        skills: ['Service design', 'IT operations', 'Application support', 'Service desk']
      },
      {
        code: 'SKLS',
        name: 'Skills and Quality',
        skills: ['Quality assurance', 'Quality management', 'Knowledge management', 'Learning design']
      },
      {
        code: 'RLMT',
        name: 'Relationships and Engagement',
        skills: ['Stakeholder management', 'Customer service support', 'Business analysis', 'Data analysis']
      }
    ],
    levels: [
      { level: 1, name: 'Follow', autonomy: 'Works under close direction' },
      { level: 2, name: 'Assist', autonomy: 'Works under routine direction' },
      { level: 3, name: 'Apply', autonomy: 'Works under general direction' },
      { level: 4, name: 'Enable', autonomy: 'Works under general guidance' },
      { level: 5, name: 'Ensure/Advise', autonomy: 'Works under broad direction' },
      { level: 6, name: 'Initiate/Influence', autonomy: 'Has defined authority' },
      { level: 7, name: 'Set Strategy/Inspire', autonomy: 'Sets organisational objectives' }
    ],
    tips: [
      'Most delivery work is done at levels 3-5',
      'Level 1-2 are typically junior or trainee roles',
      'Level 6-7 are leadership and strategic roles',
      'Use skill descriptions to determine the right level'
    ]
  },
  
  tiers: {
    title: 'Rate Tiers',
    description: 'Different supplier tiers have different rate cards reflecting their market positioning and cost structures.',
    tiers: [
      {
        tier: 'Contractor',
        description: 'Individual contractors and freelancers',
        characteristics: ['Flexible engagement', 'Direct relationship', 'Often specialist skills'],
        typical_use: 'Short-term specialist needs, flexible capacity'
      },
      {
        tier: 'Prime',
        description: 'Tier 1 consulting firms and system integrators',
        characteristics: ['Premium rates', 'Enterprise delivery', 'Full-service capability'],
        typical_use: 'Large transformations, enterprise programmes'
      },
      {
        tier: 'Mid',
        description: 'Mid-market consulting firms and service providers',
        characteristics: ['Competitive rates', 'Specialist focus', 'Flexible delivery'],
        typical_use: 'Most project delivery work'
      },
      {
        tier: 'SME',
        description: 'Small and medium enterprises, boutique firms',
        characteristics: ['Value rates', 'Niche expertise', 'Agile delivery'],
        typical_use: 'Specialist skills, cost-effective delivery'
      }
    ]
  },
  
  workflow: {
    title: 'Estimate Approval Workflow',
    description: 'Estimates progress through a review and approval workflow before being used for budgeting.',
    diagram: `
    ┌─────────┐     Submit     ┌───────────┐    Approve    ┌──────────┐     Archive    ┌──────────┐
    │  Draft  │ ──────────────>│ Submitted │ ─────────────>│ Approved │ ──────────────>│ Archived │
    └─────────┘                └───────────┘               └──────────┘                └──────────┘
                                     │                           │
                                     │ Request Changes           │ New Version
                                     └───────────────────────────┘
    `,
    statuses: [
      { name: 'Draft', description: 'Estimate is being developed. Can be freely edited.' },
      { name: 'Submitted', description: 'Estimate submitted for review. Awaiting approval.' },
      { name: 'Approved', description: 'Estimate approved. Locked for editing. Used for budgets.' },
      { name: 'Archived', description: 'Historical version. Kept for audit trail.' }
    ],
    transitions: [
      { from: 'Draft', to: 'Submitted', action: 'Submit', actor: 'Creator' },
      { from: 'Submitted', to: 'Approved', action: 'Approve', actor: 'Admin or PM' },
      { from: 'Submitted', to: 'Draft', action: 'Request Changes', actor: 'Approver' },
      { from: 'Approved', to: 'Draft', action: 'New Version', actor: 'Admin' },
      { from: 'Approved', to: 'Archived', action: 'Archive', actor: 'Admin' }
    ]
  },
  
  permissions: {
    contributor: {
      role: 'Contributor',
      canView: 'Estimates they are assigned to',
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canApprove: false,
      notes: 'Contributors can view estimates for planning purposes'
    },
    supplier_pm: {
      role: 'Supplier PM',
      canView: 'All estimates in project',
      canCreate: true,
      canEdit: 'Draft estimates',
      canDelete: 'Draft estimates',
      canApprove: true,
      notes: 'Supplier PMs create and approve estimates'
    },
    customer_pm: {
      role: 'Customer PM',
      canView: 'All estimates in project',
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canApprove: true,
      notes: 'Customer PMs can view and approve estimates'
    },
    admin: {
      role: 'Admin',
      canView: 'All estimates in project',
      canCreate: true,
      canEdit: 'All estimates',
      canDelete: 'All estimates',
      canApprove: true,
      notes: 'Admins have full access to all estimate functions'
    },
    partner_admin: {
      role: 'Partner Admin',
      canView: 'Partner relevant estimates only',
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canApprove: false,
      notes: 'Partner Admins can view estimates related to their work'
    },
    partner_user: {
      role: 'Partner User',
      canView: 'Limited - summary only',
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canApprove: false,
      notes: 'Partner Users see estimate summaries only'
    }
  },
  
  faq: [
    {
      question: 'Where do the day rates come from?',
      answer: 'Day rates are automatically populated from the benchmarking rate cards based on the selected skill, level, and tier. You can view all available rates in the Benchmarking page.'
    },
    {
      question: 'Can I override the benchmark rate?',
      answer: 'Yes, you can enter a custom rate by clicking on the rate cell. Overridden rates show a warning indicator and should be documented with justification.'
    },
    {
      question: 'What is a quantity multiplier?',
      answer: 'Multipliers let you scale effort for repeated work. For example, if you need 10 days per integration and have 5 integrations, enter 10 days with quantity 5 instead of 50 days.'
    },
    {
      question: 'How do I compare estimate versions?',
      answer: 'Use the Analysis tab and select "Version Comparison". You can compare any two versions of an estimate to see changes in effort, rates, and total cost.'
    },
    {
      question: 'What is the difference between Fixed Price and T&M estimates?',
      answer: 'Fixed Price estimates have a set total cost regardless of actual effort. T&M (Time & Materials) estimates show projected costs but are billed on actual effort. Blended combines both approaches.'
    },
    {
      question: 'How do I add contingency to my estimate?',
      answer: 'Scroll to the Contingency section at the bottom of the estimate. Enter a percentage (e.g., 15%) or a fixed amount. The contingency adds to the total and is tracked separately.'
    },
    {
      question: 'Can I copy an estimate from another project?',
      answer: 'Yes, export the estimate to Excel, then import into the new project. You\'ll need to adjust dates and rates for the new context.'
    },
    {
      question: 'What SFIA level should I use?',
      answer: 'Refer to the SFIA level descriptions. Most delivery work is levels 3-5. Level 3 is for experienced practitioners, level 4-5 for senior/lead roles, and level 6-7 for strategic leadership.'
    },
    {
      question: 'How do estimates link to budgets?',
      answer: 'When you link an estimate to milestones, the estimate total becomes the milestone budget. Changes to approved estimates flow through to milestone budgets automatically.'
    },
    {
      question: 'Can multiple people edit an estimate at the same time?',
      answer: 'No, estimates have a lock mechanism. When you open an estimate for editing, others see it as locked. The lock releases when you save and close, or after 15 minutes of inactivity.'
    }
  ],
  
  related: ['wbs-planning', 'benchmarking', 'milestones', 'billing', 'resources', 'variations']
};

export default estimatorGuide;
