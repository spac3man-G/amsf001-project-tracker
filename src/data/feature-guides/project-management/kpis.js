// KPIs Feature Guide
// Complete how-to documentation for Key Performance Indicators

const kpisGuide = {
  id: 'kpis',
  title: 'KPIs',
  category: 'project-management',
  description: 'Key Performance Indicators (KPIs) track measurable values that demonstrate project health and success. The system supports automatic and manual KPIs with RAG (Red/Amber/Green) status thresholds, trend tracking, and dashboard visualisation.',
  
  navigation: {
    path: '/kpis',
    sidebar: 'Project → KPIs',
    quickAccess: 'Dashboard → KPI Summary widget',
    breadcrumb: 'Home > Project > KPIs'
  },
  
  howTo: {
    create: {
      title: 'Creating a KPI',
      steps: [
        'Navigate to the KPIs page from the sidebar (Project → KPIs)',
        'Click the "Add KPI" button in the top right corner',
        'Enter a clear name for the KPI (e.g., "Schedule Variance")',
        'Select the category (Cost, Schedule, Quality, Scope, Resource)',
        'Choose the KPI type: Automatic (calculated) or Manual (entered)',
        'Set the target value you are aiming for',
        'Configure RAG thresholds (what values mean Red, Amber, Green)',
        'Select the measurement frequency (Weekly, Monthly, etc.)',
        'Add a description explaining what this KPI measures',
        'Click "Save" to create the KPI'
      ],
      tips: [
        'Choose meaningful KPIs that drive decisions',
        'Set realistic targets based on baselines or benchmarks',
        'Fewer well-chosen KPIs are better than many unfocused ones',
        'Include a mix of leading and lagging indicators',
        'Ensure thresholds align with project tolerances'
      ],
      videoUrl: null
    },
    update: {
      title: 'Recording KPI Values (Manual KPIs)',
      steps: [
        'Navigate to the KPIs page',
        'Find the manual KPI you want to update',
        'Click "Record Value" or open the KPI details',
        'Enter the current value',
        'Add any notes explaining the measurement',
        'The system calculates RAG status based on thresholds',
        'Click "Save" to record the value',
        'Previous values are retained for trend analysis'
      ],
      tips: [
        'Record values at consistent intervals',
        'Add context in notes for unusual values',
        'Automatic KPIs update themselves - no manual entry needed',
        'Historical values build the trend chart'
      ]
    },
    setThresholds: {
      title: 'Configuring RAG Thresholds',
      steps: [
        'Open the KPI you want to configure',
        'Click "Edit" or go to the "Thresholds" section',
        'Decide if higher or lower values are better for this KPI',
        'Set the Green threshold (good performance)',
        'Set the Amber threshold (warning level)',
        'Set the Red threshold (poor performance / action needed)',
        'Preview how sample values would be rated',
        'Save the threshold configuration'
      ],
      tips: [
        'Thresholds work differently for "higher is better" vs "lower is better" KPIs',
        'For "higher is better": Green ≥ X, Amber ≥ Y, Red < Y',
        'For "lower is better": Green ≤ X, Amber ≤ Y, Red > Y',
        'Align thresholds with project tolerances and risk appetite',
        'Test thresholds with realistic values before finalising'
      ]
    },
    view: {
      title: 'Viewing KPIs',
      steps: [
        'Navigate to the KPIs page from the sidebar',
        'View the KPI dashboard showing all KPIs with current RAG status',
        'Use category filters to focus on specific areas (Cost, Schedule, etc.)',
        'Click on any KPI to see full details and history',
        'View the trend chart showing value changes over time',
        'Use the Dashboard KPI widget for a summary view'
      ],
      tips: [
        'RAG colours give instant health indication',
        'Trend arrows show if KPIs are improving or declining',
        'Dashboard widget shows KPIs needing attention',
        'Export KPI data for reporting'
      ]
    },
    analyse: {
      title: 'Analysing KPI Trends',
      steps: [
        'Open the KPI you want to analyse',
        'View the trend chart showing historical values',
        'Identify patterns, improvements, or deterioration',
        'Compare against target line on the chart',
        'Review notes for context on unusual values',
        'Use date range filters to focus on specific periods'
      ],
      tips: [
        'Look for sustained trends, not just single values',
        'Consider external factors that may explain changes',
        'Use trends to predict future performance',
        'Share trend analysis in status reports'
      ]
    },
    configureAutomatic: {
      title: 'Setting Up Automatic KPIs',
      steps: [
        'Create a new KPI and select "Automatic" type',
        'Choose the data source (e.g., Timesheets, Milestones, Budget)',
        'Select the calculation method (variance, percentage, count, etc.)',
        'Configure any parameters for the calculation',
        'Set the RAG thresholds',
        'Save the KPI',
        'The system will calculate and update values automatically'
      ],
      tips: [
        'Automatic KPIs reduce manual effort',
        'Values update when source data changes',
        'Common automatic KPIs: Budget variance, Schedule variance, Utilisation',
        'Review calculations periodically to ensure accuracy'
      ]
    }
  },
  
  fields: {
    name: {
      name: 'Name',
      label: 'KPI Name',
      required: true,
      type: 'text',
      description: 'A clear name for the KPI',
      validation: 'Required. Maximum 200 characters.',
      tips: 'Use descriptive names like "Budget Variance %" not "KPI1".'
    },
    category: {
      name: 'Category',
      label: 'Category',
      required: true,
      type: 'select',
      description: 'The area this KPI measures',
      values: ['Cost', 'Schedule', 'Quality', 'Scope', 'Resource', 'Risk', 'Customer', 'Other'],
      tips: 'Choose the category that best represents what is being measured.'
    },
    description: {
      name: 'Description',
      label: 'Description',
      required: false,
      type: 'textarea',
      description: 'Explanation of what this KPI measures and why it matters',
      tips: 'Include how the KPI is calculated and what decisions it informs.'
    },
    type: {
      name: 'Type',
      label: 'KPI Type',
      required: true,
      type: 'select',
      description: 'Whether values are calculated automatically or entered manually',
      values: ['Automatic', 'Manual'],
      tips: 'Automatic KPIs calculate from project data; Manual requires periodic entry.'
    },
    target: {
      name: 'Target',
      label: 'Target Value',
      required: true,
      type: 'number',
      description: 'The value you are aiming to achieve',
      tips: 'Set a realistic, achievable target based on baseline or benchmark data.'
    },
    current_value: {
      name: 'Current Value',
      label: 'Current Value',
      required: false,
      type: 'number',
      description: 'The most recent measured value',
      tips: 'Updated automatically or manually depending on KPI type.'
    },
    unit: {
      name: 'Unit',
      label: 'Unit of Measure',
      required: false,
      type: 'text',
      description: 'The unit for this KPI (%, days, £, count, etc.)',
      tips: 'Include units for clarity in reporting.'
    },
    rag_status: {
      name: 'RAG Status',
      label: 'RAG Status',
      required: false,
      type: 'calculated',
      description: 'Calculated Red/Amber/Green status based on thresholds',
      tips: 'Automatically determined by comparing current value to thresholds.'
    },
    trend: {
      name: 'Trend',
      label: 'Trend',
      required: false,
      type: 'calculated',
      description: 'Direction of recent changes (improving, stable, declining)',
      tips: 'Calculated from recent value history.'
    },
    frequency: {
      name: 'Frequency',
      label: 'Measurement Frequency',
      required: true,
      type: 'select',
      description: 'How often this KPI should be measured',
      values: ['Daily', 'Weekly', 'Fortnightly', 'Monthly', 'Quarterly'],
      tips: 'Choose frequency based on how quickly the KPI can change.'
    }
  },
  
  ragStatus: {
    title: 'RAG Status Explanation',
    description: 'RAG (Red, Amber, Green) status provides a visual indicator of KPI health based on configured thresholds.',
    statuses: [
      {
        name: 'Green',
        colour: 'green',
        meaning: 'On target - KPI is meeting or exceeding the target',
        action: 'Continue current approach; monitor for changes'
      },
      {
        name: 'Amber',
        colour: 'amber',
        meaning: 'Warning - KPI is approaching tolerance limits',
        action: 'Investigate cause; consider corrective action; increased monitoring'
      },
      {
        name: 'Red',
        colour: 'red',
        meaning: 'Off target - KPI is outside acceptable tolerance',
        action: 'Immediate attention required; implement corrective action; escalate if needed'
      }
    ],
    calculation: {
      higherIsBetter: {
        description: 'For KPIs where higher values are better (e.g., utilisation, completion %)',
        example: 'Target: 90%, Green: ≥85%, Amber: 70-84%, Red: <70%'
      },
      lowerIsBetter: {
        description: 'For KPIs where lower values are better (e.g., defects, variance)',
        example: 'Target: 5%, Green: ≤5%, Amber: 6-10%, Red: >10%'
      }
    },
    tips: [
      'Thresholds should reflect project risk tolerance',
      'Review and adjust thresholds if they become irrelevant',
      'Consider the impact of each status on project decisions',
      'Consistent threshold logic across similar KPIs aids comparison'
    ]
  },
  
  categories: {
    cost: {
      name: 'Cost',
      description: 'Financial performance indicators',
      examples: ['Budget Variance', 'Cost Performance Index (CPI)', 'Earned Value', 'Burn Rate']
    },
    schedule: {
      name: 'Schedule',
      description: 'Timeline and delivery performance',
      examples: ['Schedule Variance', 'Schedule Performance Index (SPI)', 'Milestone Completion', 'On-Time Delivery']
    },
    quality: {
      name: 'Quality',
      description: 'Quality and defect metrics',
      examples: ['Defect Rate', 'Test Coverage', 'Review Pass Rate', 'Customer Satisfaction']
    },
    scope: {
      name: 'Scope',
      description: 'Scope and requirements tracking',
      examples: ['Scope Creep %', 'Requirements Completion', 'Change Request Volume']
    },
    resource: {
      name: 'Resource',
      description: 'Team and resource utilisation',
      examples: ['Utilisation Rate', 'Capacity %', 'Turnover Rate', 'Training Completion']
    },
    risk: {
      name: 'Risk',
      description: 'Risk management metrics',
      examples: ['Open High Risks', 'Risk Mitigation Rate', 'Issues Closure Time']
    },
    customer: {
      name: 'Customer',
      description: 'Customer and stakeholder satisfaction',
      examples: ['NPS Score', 'Satisfaction Rating', 'Response Time', 'Escalation Count']
    }
  },
  
  permissions: {
    contributor: {
      role: 'Contributor',
      canView: 'All KPIs (read-only)',
      canCreate: false,
      canEdit: false,
      canRecordValues: false,
      canConfigureThresholds: false,
      notes: 'Contributors can view KPI status for project awareness'
    },
    supplier_pm: {
      role: 'Supplier PM',
      canView: 'All KPIs',
      canCreate: true,
      canEdit: true,
      canRecordValues: true,
      canConfigureThresholds: true,
      canDelete: true,
      notes: 'Supplier PMs manage KPIs and record values'
    },
    customer_pm: {
      role: 'Customer PM',
      canView: 'All KPIs',
      canCreate: true,
      canEdit: true,
      canRecordValues: true,
      canConfigureThresholds: true,
      canDelete: false,
      notes: 'Customer PMs can manage and update KPIs'
    },
    admin: {
      role: 'Admin',
      canView: 'All KPIs',
      canCreate: true,
      canEdit: true,
      canRecordValues: true,
      canConfigureThresholds: true,
      canDelete: true,
      notes: 'Admins have full access to KPI management'
    },
    partner_admin: {
      role: 'Partner Admin',
      canView: 'All KPIs (read-only)',
      canCreate: false,
      canEdit: false,
      canRecordValues: false,
      canConfigureThresholds: false,
      notes: 'Partner Admins can view KPI status'
    },
    partner_user: {
      role: 'Partner User',
      canView: 'All KPIs (read-only)',
      canCreate: false,
      canEdit: false,
      canRecordValues: false,
      canConfigureThresholds: false,
      notes: 'Partner Users can view KPI status'
    }
  },
  
  faq: [
    {
      question: 'What do the RAG colours mean?',
      answer: 'RAG stands for Red, Amber, Green. Green means on target, Amber is a warning that performance is slipping, and Red means off target requiring action. The colours are calculated based on thresholds you configure for each KPI.'
    },
    {
      question: 'What is the difference between Automatic and Manual KPIs?',
      answer: 'Automatic KPIs calculate values from project data (timesheets, budgets, milestones) and update automatically. Manual KPIs require someone to enter values periodically. Use automatic where possible to reduce effort and ensure consistency.'
    },
    {
      question: 'How do I set appropriate thresholds?',
      answer: 'Base thresholds on project tolerances agreed with stakeholders. Green should represent acceptable performance, Amber should trigger investigation, and Red should require action. Consider baseline data and industry benchmarks when setting values.'
    },
    {
      question: 'How is the trend calculated?',
      answer: 'Trend compares recent values to determine direction. An improving trend shows values moving toward target, stable means little change, and declining shows movement away from target. Trend considers the last 3-5 data points.'
    },
    {
      question: 'How often should I update manual KPIs?',
      answer: 'Follow the measurement frequency set for each KPI. Weekly KPIs should be updated weekly, monthly KPIs monthly, etc. Consistent updates ensure accurate trending and timely identification of issues.'
    },
    {
      question: 'What KPIs should I track?',
      answer: 'Focus on KPIs that inform decisions. Common project KPIs include: Budget Variance (cost), Schedule Variance (time), Defect Rate (quality), Scope Changes (scope), and Team Utilisation (resources). Choose 5-10 meaningful KPIs rather than tracking everything.'
    },
    {
      question: 'Can I change thresholds after a KPI is created?',
      answer: 'Yes, you can edit thresholds at any time. However, changing thresholds will recalculate RAG status for current values. Historical status records are preserved to maintain audit trail.'
    },
    {
      question: 'How do I use KPIs in status reporting?',
      answer: 'The KPI dashboard provides a summary view perfect for status reports. Export KPI data or use the dashboard widget. RAG status gives instant health indication, and trends show direction of travel.'
    }
  ],
  
  related: ['quality-standards', 'milestones', 'billing', 'resources', 'workflows']
};

export default kpisGuide;
