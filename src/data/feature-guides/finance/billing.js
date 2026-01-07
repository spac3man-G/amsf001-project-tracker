// Billing Feature Guide
// Complete how-to documentation for project billing and finance functionality

const billingGuide = {
  id: 'billing',
  title: 'Billing & Finance',
  category: 'finance',
  description: 'Track project finances including budget allocation, actual spend, billing status, and variance analysis. Monitor milestone payments, view financial summaries, and manage chargeable items across the project.',
  
  navigation: {
    path: '/finance',
    sidebar: 'Finance → Billing',
    quickAccess: 'Dashboard → Budget Status widget',
    breadcrumb: 'Home > Finance > Billing'
  },
  
  howTo: {
    viewSummary: {
      title: 'Viewing the Finance Dashboard',
      steps: [
        'Navigate to the Finance page from the sidebar (Finance → Billing)',
        'The dashboard displays key financial metrics at a glance',
        'Summary cards show: Total Budget, Actual Spend, Remaining, Forecast',
        'The burn rate chart shows spend over time vs planned',
        'Use the period selector to view specific date ranges',
        'Click on any summary card to drill down to details'
      ],
      metrics: [
        { name: 'Total Budget', description: 'Sum of all milestone budgets' },
        { name: 'Actual Spend', description: 'Total of approved timesheets and expenses' },
        { name: 'Remaining Budget', description: 'Budget minus actual spend' },
        { name: 'Forecast at Completion', description: 'Projected total cost based on current burn rate' },
        { name: 'Variance', description: 'Difference between budget and forecast' },
        { name: 'Burn Rate', description: 'Average spend per period' }
      ],
      tips: [
        'Red indicators show over-budget items',
        'Amber shows items approaching budget threshold',
        'Green indicates healthy budget status',
        'Export the dashboard to PDF for stakeholder reporting'
      ]
    },
    milestoneBilling: {
      title: 'Viewing Milestone Billing Status',
      steps: [
        'From the Finance dashboard, click "Milestone Billing" tab',
        'Each milestone shows: Budget, Billable Amount, Actual, Status',
        'Click a milestone row to see detailed breakdown',
        'View timesheet costs allocated to the milestone',
        'View expenses allocated to the milestone',
        'See the billing percentage complete',
        'Check certificate status for payment eligibility'
      ],
      billingStatuses: [
        { status: 'Not Started', description: 'No billable work recorded yet' },
        { status: 'In Progress', description: 'Work underway, partial billing available' },
        { status: 'Ready to Bill', description: 'Work complete, awaiting invoice' },
        { status: 'Invoiced', description: 'Invoice raised to customer' },
        { status: 'Paid', description: 'Payment received' }
      ],
      tips: [
        'Billable amount may differ from budget due to variations',
        'Certificate sign-off is typically required before invoicing',
        'Click "Generate Invoice" when milestone is complete'
      ]
    },
    viewVariance: {
      title: 'Analysing Budget Variance',
      steps: [
        'From the Finance dashboard, click "Variance Analysis" tab',
        'The variance view compares budget vs actual at multiple levels',
        'Select the breakdown: by Milestone, by Deliverable, by Resource, by Month',
        'Positive variance (green) means under budget',
        'Negative variance (red) means over budget',
        'Click any row to see contributing factors',
        'Use the trend chart to see variance over time'
      ],
      varianceTypes: [
        { type: 'Schedule Variance', description: 'Difference between planned and actual progress' },
        { type: 'Cost Variance', description: 'Difference between budgeted and actual cost' },
        { type: 'Effort Variance', description: 'Difference between estimated and actual days' },
        { type: 'Rate Variance', description: 'Difference due to rate changes from estimate' }
      ],
      tips: [
        'Drill down to find root causes of variance',
        'Export variance report for steering committees',
        'Track variance trends to predict final costs',
        'Link to variations for approved scope changes'
      ]
    },
    viewTimesheetCosts: {
      title: 'Viewing Timesheet Costs',
      steps: [
        'From the Finance dashboard, click "Time Costs" tab',
        'View approved timesheet entries with calculated costs',
        'Filter by milestone, deliverable, resource, or period',
        'Costs are calculated from resource day rates',
        'Group by any dimension for analysis',
        'Export to Excel for detailed reporting'
      ],
      calculations: [
        { field: 'Hours Cost', formula: 'Hours × (Day Rate ÷ 8)' },
        { field: 'Day Cost', formula: 'Days × Day Rate' },
        { field: 'Chargeable', formula: 'Only approved hours flagged as chargeable' }
      ],
      tips: [
        'Only Approved timesheets appear in billing',
        'Rates come from resource configuration',
        'Non-chargeable time is tracked but not billed'
      ]
    },
    viewExpenseCosts: {
      title: 'Viewing Expense Costs',
      steps: [
        'From the Finance dashboard, click "Expenses" tab',
        'View approved expense claims with amounts',
        'Filter by category, milestone, resource, or period',
        'Chargeable expenses appear in billing totals',
        'Non-chargeable expenses are tracked separately',
        'Click any expense to see receipt and details'
      ],
      tips: [
        'Chargeable flag determines billing inclusion',
        'Group by category to see spend patterns',
        'Travel and accommodation are typically chargeable',
        'Internal expenses may be non-chargeable'
      ]
    },
    trackForecast: {
      title: 'Tracking Forecast at Completion',
      steps: [
        'From the Finance dashboard, view the Forecast section',
        'EAC (Estimate at Completion) shows projected total cost',
        'ETC (Estimate to Complete) shows remaining cost',
        'The forecast uses current burn rate and remaining work',
        'Adjust assumptions to model different scenarios',
        'Compare forecast against budget for variance'
      ],
      forecastMethods: [
        { method: 'Linear', description: 'Projects based on average burn rate' },
        { method: 'Planned', description: 'Uses remaining planned effort at estimated rates' },
        { method: 'Hybrid', description: 'Combines actuals trend with remaining plan' }
      ],
      tips: [
        'Review forecast regularly in project reviews',
        'Significant variance should trigger corrective action',
        'Document forecast assumptions for audit'
      ]
    },
    generateReport: {
      title: 'Generating Finance Reports',
      steps: [
        'Click "Reports" in the Finance section',
        'Select the report type from the list',
        'Configure report parameters: date range, milestones, etc.',
        'Click "Preview" to review before generating',
        'Click "Generate" to create the report',
        'Download as PDF or Excel',
        'Schedule recurring reports for automatic delivery'
      ],
      reportTypes: [
        { name: 'Budget Status', description: 'Current budget vs actual across all milestones' },
        { name: 'Variance Analysis', description: 'Detailed variance breakdown with root causes' },
        { name: 'Burn Down', description: 'Budget consumption over time' },
        { name: 'Forecast Summary', description: 'EAC/ETC projections with assumptions' },
        { name: 'Time Analysis', description: 'Timesheet costs by resource and deliverable' },
        { name: 'Expense Summary', description: 'Expense claims by category and milestone' }
      ],
      tips: [
        'Schedule monthly budget reports automatically',
        'Include variance commentary for stakeholders',
        'Export raw data for custom analysis'
      ]
    },
    manageChargeability: {
      title: 'Managing Chargeable vs Non-Chargeable Items',
      steps: [
        'Chargeability is set when creating timesheets and expenses',
        'View chargeability summary in Finance dashboard',
        'Filter by chargeable status to see breakdown',
        'Non-chargeable items don\'t appear in customer billing',
        'Both types count toward project actuals',
        'Update chargeability rules in Project Settings'
      ],
      chargeabilityRules: [
        { type: 'Timesheets', rule: 'All time is chargeable by default' },
        { type: 'Expenses', rule: 'Chargeable flag set per expense' },
        { type: 'Travel', rule: 'Typically chargeable to customer' },
        { type: 'Internal', rule: 'Typically non-chargeable' }
      ],
      tips: [
        'Review chargeability regularly for accuracy',
        'Some contracts have expense caps',
        'Document non-chargeable reasons for audit'
      ]
    }
  },
  
  fields: {
    total_budget: {
      name: 'Total Budget',
      label: 'Budget',
      type: 'currency',
      description: 'Total project budget from all milestone allocations',
      calculation: 'Sum of all milestone budget amounts',
      tips: 'Updated when milestones or variations are approved'
    },
    actual_spend: {
      name: 'Actual Spend',
      label: 'Actual',
      type: 'currency',
      description: 'Total actual costs from approved time and expenses',
      calculation: 'Sum of approved timesheet costs + approved expense amounts',
      tips: 'Only includes approved items'
    },
    remaining: {
      name: 'Remaining Budget',
      label: 'Remaining',
      type: 'currency',
      description: 'Budget not yet consumed',
      calculation: 'Total Budget - Actual Spend',
      tips: 'Negative indicates over-budget'
    },
    variance: {
      name: 'Variance',
      label: 'Variance',
      type: 'currency',
      description: 'Difference between budget and actual/forecast',
      calculation: 'Budget - Actual (or Budget - Forecast)',
      tips: 'Positive is favourable, negative is unfavourable'
    },
    variance_percent: {
      name: 'Variance %',
      label: 'Var %',
      type: 'percentage',
      description: 'Variance as percentage of budget',
      calculation: '(Variance ÷ Budget) × 100',
      tips: 'Helps compare variance across different sized milestones'
    },
    burn_rate: {
      name: 'Burn Rate',
      label: 'Burn Rate',
      type: 'currency',
      description: 'Average spend per period (week/month)',
      calculation: 'Actual Spend ÷ Number of Periods',
      tips: 'Used to project forecast at completion'
    },
    eac: {
      name: 'Estimate at Completion',
      label: 'EAC',
      type: 'currency',
      description: 'Projected total cost when project completes',
      calculation: 'Actual + Estimate to Complete',
      tips: 'Key indicator for budget health'
    },
    etc: {
      name: 'Estimate to Complete',
      label: 'ETC',
      type: 'currency',
      description: 'Projected cost to finish remaining work',
      calculation: 'Remaining effort × average rate',
      tips: 'Review against remaining budget'
    },
    billable_amount: {
      name: 'Billable Amount',
      label: 'Billable',
      type: 'currency',
      description: 'Amount that can be invoiced to customer',
      calculation: 'Chargeable time costs + chargeable expenses',
      tips: 'May differ from actual due to non-chargeable items'
    },
    milestone_budget: {
      name: 'Milestone Budget',
      label: 'Milestone Budget',
      type: 'currency',
      description: 'Budget allocated to a specific milestone',
      tips: 'Set when milestone is created or via variation'
    },
    milestone_actual: {
      name: 'Milestone Actual',
      label: 'Milestone Actual',
      type: 'currency',
      description: 'Actual spend allocated to a milestone',
      calculation: 'Sum of costs for deliverables in milestone',
      tips: 'Based on deliverable assignments'
    }
  },
  
  ragThresholds: {
    title: 'RAG Status Thresholds',
    description: 'Red/Amber/Green status indicates budget health',
    thresholds: [
      {
        status: 'Green',
        colour: '#22C55E',
        condition: 'Variance >= 0 or spend < 90% of budget',
        meaning: 'On track, no concerns'
      },
      {
        status: 'Amber',
        colour: '#F59E0B',
        condition: 'Spend 90-100% of budget or minor variance',
        meaning: 'Approaching budget, monitor closely'
      },
      {
        status: 'Red',
        colour: '#EF4444',
        condition: 'Over budget or forecast exceeds budget',
        meaning: 'Over budget, action required'
      }
    ],
    tips: [
      'Thresholds can be customised in Project Settings',
      'RAG status appears on dashboards and reports',
      'Red status should trigger escalation'
    ]
  },
  
  calculations: {
    title: 'Financial Calculations',
    description: 'How key financial metrics are calculated',
    formulas: [
      {
        metric: 'Timesheet Cost',
        formula: 'Hours Worked × Hourly Rate',
        notes: 'Hourly Rate = Day Rate ÷ 8'
      },
      {
        metric: 'Resource Cost',
        formula: 'Σ(Timesheet Costs for Resource)',
        notes: 'Totalled across all approved timesheets'
      },
      {
        metric: 'Milestone Cost',
        formula: 'Σ(Deliverable Costs in Milestone)',
        notes: 'Rolled up from deliverable assignments'
      },
      {
        metric: 'Project Cost',
        formula: 'Σ(Milestone Costs) + Unallocated Costs',
        notes: 'Total of all project spend'
      },
      {
        metric: 'Burn Rate',
        formula: 'Actual Spend ÷ Elapsed Periods',
        notes: 'Used for linear forecasting'
      },
      {
        metric: 'EAC (Linear)',
        formula: 'Actual + (Burn Rate × Remaining Periods)',
        notes: 'Assumes constant burn rate'
      },
      {
        metric: 'EAC (Planned)',
        formula: 'Actual + Remaining Estimate',
        notes: 'Uses estimate for remaining work'
      },
      {
        metric: 'Cost Variance',
        formula: 'Budget - Actual',
        notes: 'Positive = under budget'
      },
      {
        metric: 'Schedule Variance',
        formula: 'Planned Progress - Actual Progress',
        notes: 'Measured in cost terms'
      },
      {
        metric: 'CPI (Cost Performance Index)',
        formula: 'Earned Value ÷ Actual Cost',
        notes: '>1 is good, <1 is over budget'
      }
    ]
  },
  
  permissions: {
    contributor: {
      role: 'Contributor',
      canViewSummary: 'Limited - own costs only',
      canViewDetail: false,
      canViewRates: false,
      canExport: false,
      canGenerateReports: false,
      notes: 'Contributors see their own timesheet costs only'
    },
    supplier_pm: {
      role: 'Supplier PM',
      canViewSummary: true,
      canViewDetail: true,
      canViewRates: true,
      canExport: true,
      canGenerateReports: true,
      notes: 'Supplier PMs have full visibility for project management'
    },
    customer_pm: {
      role: 'Customer PM',
      canViewSummary: true,
      canViewDetail: true,
      canViewRates: 'Summary only',
      canExport: true,
      canGenerateReports: true,
      notes: 'Customer PMs see billing totals, not individual rates'
    },
    admin: {
      role: 'Admin',
      canViewSummary: true,
      canViewDetail: true,
      canViewRates: true,
      canExport: true,
      canGenerateReports: true,
      notes: 'Admins have full access to all financial data'
    },
    partner_admin: {
      role: 'Partner Admin',
      canViewSummary: 'Partner portion only',
      canViewDetail: 'Partner portion only',
      canViewRates: false,
      canExport: 'Partner data only',
      canGenerateReports: false,
      notes: 'Partners see their allocated work only'
    },
    partner_user: {
      role: 'Partner User',
      canViewSummary: false,
      canViewDetail: false,
      canViewRates: false,
      canExport: false,
      canGenerateReports: false,
      notes: 'Partner Users do not have access to billing data'
    }
  },
  
  faq: [
    {
      question: 'What is the difference between budget and billable?',
      answer: 'Budget is the planned cost for the project. Billable is the amount that can actually be invoiced to the customer based on approved chargeable work. They may differ due to non-chargeable items, variations, or contract terms.'
    },
    {
      question: 'Why doesn\'t my timesheet appear in billing yet?',
      answer: 'Timesheets only appear in billing after they reach "Approved" status. Check that your timesheet has been validated by the Supplier PM and approved by the Customer PM.'
    },
    {
      question: 'How is the forecast calculated?',
      answer: 'The default forecast uses your current burn rate (average spend per period) and projects forward based on remaining project duration. You can switch to planned method which uses the estimate for remaining work.'
    },
    {
      question: 'What does negative variance mean?',
      answer: 'Negative variance means you are over budget - actual spend exceeds the budget. This requires attention and may need a variation to increase the budget or corrective action to reduce spend.'
    },
    {
      question: 'Can I see individual resource rates?',
      answer: 'Rate visibility depends on your role. Supplier PMs and Admins can see individual rates. Customer PMs typically see totals only. Contributors see their own costs without rates.'
    },
    {
      question: 'How do variations affect the budget?',
      answer: 'Approved variations can increase or decrease the budget. When a variation is approved, the affected milestone budgets are updated automatically. The original baseline is preserved for comparison.'
    },
    {
      question: 'What is the burn rate?',
      answer: 'Burn rate is your average spend per period (usually per week or month). It\'s calculated by dividing actual spend by elapsed time. It helps predict when budget will be exhausted.'
    },
    {
      question: 'How do I reconcile billing with invoices?',
      answer: 'Use the Invoice Reconciliation view to match billing amounts with raised invoices. Each milestone shows what\'s been invoiced vs what\'s billable, helping identify unbilled work.'
    },
    {
      question: 'What happens to non-chargeable time?',
      answer: 'Non-chargeable time is recorded and tracked in project actuals but doesn\'t appear in customer billing. It\'s visible in internal reports and affects true project cost.'
    },
    {
      question: 'Can I export billing data to our finance system?',
      answer: 'Yes, use the Export function to generate CSV or Excel files. Standard formats are available for common finance systems. Contact your Admin for custom integration options.'
    }
  ],
  
  related: ['timesheets', 'expenses', 'milestones', 'variations', 'partner-invoices', 'estimator']
};

export default billingGuide;
