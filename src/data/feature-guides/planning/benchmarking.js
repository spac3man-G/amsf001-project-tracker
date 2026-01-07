// Benchmarking Feature Guide
// Complete how-to documentation for day rate benchmarks and rate card functionality

const benchmarkingGuide = {
  id: 'benchmarking',
  title: 'Benchmarking',
  category: 'planning',
  description: 'View and manage day rate benchmarks based on SFIA 8 skills and levels. Rate cards provide standard pricing across different supplier tiers, enabling consistent and transparent cost estimation.',
  
  navigation: {
    path: '/benchmarking',
    sidebar: 'Planning → Benchmarking',
    quickAccess: 'Estimator → View Rate Card link',
    breadcrumb: 'Home > Planning > Benchmarking'
  },
  
  howTo: {
    view: {
      title: 'Viewing Rate Cards',
      steps: [
        'Navigate to the Benchmarking page from the sidebar (Planning → Benchmarking)',
        'The default view shows all rates in a grid format',
        'Rows represent SFIA skills, columns represent levels (1-7)',
        'Use the Tier selector to switch between rate cards (Contractor, Prime, Mid, SME)',
        'Click on any cell to see rate details and effective dates',
        'Use the summary cards at the top for average rates by tier'
      ],
      tips: [
        'Compare tiers by switching between them',
        'Rates are shown in daily amounts (GBP)',
        'Hover over cells to see the full skill name',
        'Use export for detailed analysis in Excel'
      ]
    },
    filter: {
      title: 'Filtering by Skill and Level',
      steps: [
        'Use the Category filter to show skills from specific SFIA categories',
        'Use the Skill search box to find specific skills by name or code',
        'Use the Level checkboxes to show only certain levels (e.g., 3-5)',
        'Combine filters to narrow down to specific rate ranges',
        'Click "Clear Filters" to reset to the full view',
        'Filtered views can be exported'
      ],
      filters: [
        { name: 'Category', description: 'SFIA skill category (Strategy, Change, Development, etc.)' },
        { name: 'Skill', description: 'Specific SFIA skill by name or code' },
        { name: 'Level', description: 'SFIA levels 1-7' },
        { name: 'Tier', description: 'Supplier tier (Contractor, Prime, Mid, SME)' },
        { name: 'Rate Range', description: 'Minimum and maximum day rate' }
      ],
      tips: [
        'Category filter is useful for role-based searches',
        'Level filter helps when looking for specific seniority',
        'Use rate range to find resources within budget'
      ]
    },
    export: {
      title: 'Exporting Rate Data',
      steps: [
        'Apply any filters to select the rates you want to export',
        'Click the "Export" button in the toolbar',
        'Choose the export format: Excel (.xlsx), CSV, or PDF',
        'Select which columns to include in the export',
        'Choose whether to include all tiers or just the selected tier',
        'Click "Export" to download the file',
        'The export includes effective dates and any notes'
      ],
      exportFormats: [
        { format: 'Excel (.xlsx)', description: 'Full workbook with separate sheets per tier' },
        { format: 'CSV', description: 'Single flat file for data import' },
        { format: 'PDF', description: 'Formatted document for sharing' }
      ],
      tips: [
        'Excel export includes all tiers in separate sheets',
        'PDF export is best for stakeholder sharing',
        'CSV is useful for importing into other systems'
      ]
    },
    compare: {
      title: 'Comparing Tiers',
      steps: [
        'Click "Compare Tiers" in the toolbar',
        'Select two or more tiers to compare',
        'The view switches to comparison mode',
        'Each skill/level shows rates from all selected tiers side-by-side',
        'Variance columns show the difference between tiers',
        'Use this to justify tier selection in estimates'
      ],
      tips: [
        'Comparison helps explain pricing differences to stakeholders',
        'Variance is shown as both amount and percentage',
        'Export comparison for proposal documentation'
      ]
    },
    search: {
      title: 'Searching for Specific Rates',
      steps: [
        'Use the search box at the top of the page',
        'Type a skill name (e.g., "Software development")',
        'Or type a SFIA code (e.g., "PROG")',
        'Results filter as you type',
        'Click on a result to see all levels and tiers for that skill',
        'The detail view shows rate history and notes'
      ],
      tips: [
        'Search accepts partial matches',
        'SFIA codes are faster than full names',
        'Click a result to see the full rate card row'
      ]
    },
    history: {
      title: 'Viewing Rate History',
      steps: [
        'Click on any rate cell in the grid',
        'The detail panel shows on the right',
        'Click "View History" to see rate changes over time',
        'History shows effective dates, old rate, new rate, and change reason',
        'Use this to understand rate trends',
        'Export history for audit purposes'
      ],
      tips: [
        'Rate changes are tracked for compliance',
        'History helps explain cost increases over time',
        'All historical rates are preserved'
      ]
    }
  },
  
  fields: {
    skill: {
      name: 'Skill',
      label: 'SFIA Skill',
      required: true,
      type: 'readonly',
      description: 'The SFIA 8 skill category',
      tips: 'Skills are defined by the SFIA framework'
    },
    skill_code: {
      name: 'Skill Code',
      label: 'Code',
      required: true,
      type: 'readonly',
      description: 'The SFIA skill reference code',
      tips: 'Use codes for quick reference and search'
    },
    level: {
      name: 'Level',
      label: 'Level',
      required: true,
      type: 'readonly',
      description: 'SFIA skill level (1-7)',
      validation: '1-7',
      tips: 'Higher levels indicate more seniority and higher rates'
    },
    tier: {
      name: 'Tier',
      label: 'Rate Tier',
      required: true,
      type: 'readonly',
      description: 'The supplier pricing tier',
      values: ['Contractor', 'Prime', 'Mid', 'SME'],
      tips: 'Different tiers have different rate cards'
    },
    day_rate: {
      name: 'Day Rate',
      label: 'Day Rate (£)',
      required: true,
      type: 'currency',
      description: 'The standard daily rate for this combination',
      tips: 'Rates are in GBP. Contact admin for currency conversion.'
    },
    effective_date: {
      name: 'Effective Date',
      label: 'Effective From',
      required: true,
      type: 'date',
      description: 'When this rate became effective',
      tips: 'Rates apply from this date until superseded'
    },
    category: {
      name: 'Category',
      label: 'SFIA Category',
      required: true,
      type: 'readonly',
      description: 'The SFIA skill category grouping',
      tips: 'Categories group related skills'
    },
    notes: {
      name: 'Notes',
      label: 'Notes',
      required: false,
      type: 'text',
      description: 'Additional information about this rate',
      tips: 'May include assumptions or qualifications'
    }
  },
  
  rateTiers: {
    title: 'Understanding Rate Tiers',
    description: 'Rate cards are organised by supplier tier, reflecting different market segments and cost structures.',
    tiers: [
      {
        tier: 'Contractor',
        description: 'Individual contractors and freelancers sourced directly',
        characteristics: [
          'Direct engagement with individuals',
          'Often specialist or niche skills',
          'Flexible duration and commitment',
          'No supplier management overhead'
        ],
        ratePosition: 'Typically 10-20% below Prime rates',
        whenToUse: [
          'Short-term specialist needs',
          'Specific technical expertise',
          'Flexible capacity requirements',
          'Direct accountability preferred'
        ]
      },
      {
        tier: 'Prime',
        description: 'Tier 1 consulting firms and major system integrators',
        characteristics: [
          'Global delivery capability',
          'Enterprise-scale programmes',
          'Full service offerings',
          'Significant account management'
        ],
        ratePosition: 'Highest rates - premium positioning',
        whenToUse: [
          'Large transformation programmes',
          'Enterprise-wide initiatives',
          'Complex multi-vendor environments',
          'Strategic partnerships'
        ]
      },
      {
        tier: 'Mid',
        description: 'Mid-market consulting firms and service providers',
        characteristics: [
          'Competitive pricing',
          'Specialist focus areas',
          'Flexible delivery models',
          'Good value proposition'
        ],
        ratePosition: 'Typically 15-25% below Prime rates',
        whenToUse: [
          'Standard project delivery',
          'Specialist domain expertise',
          'Cost-effective delivery',
          'Medium complexity work'
        ]
      },
      {
        tier: 'SME',
        description: 'Small and medium enterprises, boutique consultancies',
        characteristics: [
          'Competitive rates',
          'Niche expertise',
          'Agile and responsive',
          'Personal service'
        ],
        ratePosition: 'Typically 20-35% below Prime rates',
        whenToUse: [
          'Specialist niche skills',
          'Cost-sensitive projects',
          'Smaller engagements',
          'Local or regional delivery'
        ]
      }
    ],
    comparison: {
      description: 'Typical rate positioning between tiers',
      example: {
        skill: 'Software Development',
        level: 4,
        rates: [
          { tier: 'Contractor', rate: 550, index: 85 },
          { tier: 'Prime', rate: 650, index: 100 },
          { tier: 'Mid', rate: 525, index: 81 },
          { tier: 'SME', rate: 475, index: 73 }
        ],
        note: 'Index shows rate as percentage of Prime tier'
      }
    }
  },
  
  sfiaCategories: {
    title: 'SFIA 8 Skill Categories',
    description: 'Skills are organised into categories reflecting different professional areas.',
    categories: [
      {
        code: 'STGY',
        name: 'Strategy and Architecture',
        description: 'Strategic planning, enterprise architecture, and technical leadership',
        exampleSkills: [
          'Information strategy (INST)',
          'Solution architecture (ARCH)',
          'Enterprise architecture (STPL)',
          'Emerging technology monitoring (EMRG)'
        ]
      },
      {
        code: 'CHNG',
        name: 'Change and Transformation',
        description: 'Programme and project delivery, change management',
        exampleSkills: [
          'Project management (PRMG)',
          'Programme management (PGMG)',
          'Business change management (CHMG)',
          'Benefits management (BENM)'
        ]
      },
      {
        code: 'DEV',
        name: 'Development and Implementation',
        description: 'Software development, testing, and release management',
        exampleSkills: [
          'Software development (PROG)',
          'Testing (TEST)',
          'Systems integration (SINT)',
          'Release and deployment (RELM)'
        ]
      },
      {
        code: 'DLVR',
        name: 'Delivery and Operation',
        description: 'IT operations, service management, and support',
        exampleSkills: [
          'IT infrastructure (ITOP)',
          'Application support (ASUP)',
          'Service desk and incident management (USUP)',
          'Database administration (DBAD)'
        ]
      },
      {
        code: 'SKLS',
        name: 'Skills and Quality',
        description: 'Quality management, learning, and competency development',
        exampleSkills: [
          'Quality management (QUMG)',
          'Quality assurance (TEST)',
          'Learning delivery (ETDL)',
          'Competency assessment (LEDA)'
        ]
      },
      {
        code: 'RLMT',
        name: 'Relationships and Engagement',
        description: 'Business analysis, stakeholder management, and customer engagement',
        exampleSkills: [
          'Business analysis (BUAN)',
          'Stakeholder relationship management (RLMT)',
          'Customer service support (CSMG)',
          'Data analysis (DTAN)'
        ]
      },
      {
        code: 'SCTY',
        name: 'Security and Privacy',
        description: 'Information security, risk management, and compliance',
        exampleSkills: [
          'Information security (SCTY)',
          'Security administration (SCAD)',
          'Vulnerability assessment (VUAS)',
          'Digital forensics (DGFS)'
        ]
      }
    ]
  },
  
  sfiaLevels: {
    title: 'SFIA Level Descriptions',
    description: 'Levels 1-7 indicate increasing responsibility, autonomy, and complexity.',
    levels: [
      {
        level: 1,
        name: 'Follow',
        summary: 'Entry level, works under close direction',
        autonomy: 'Works under close direction. Uses little discretion.',
        complexity: 'Performs routine activities in a structured environment.',
        influence: 'Minimal influence on own work.',
        typicalRoles: ['Junior Developer', 'Trainee Analyst', 'Support Assistant'],
        experience: '0-2 years'
      },
      {
        level: 2,
        name: 'Assist',
        summary: 'Junior professional, routine direction',
        autonomy: 'Works under routine direction. Uses limited discretion.',
        complexity: 'Performs a range of work activities in varied environments.',
        influence: 'Interacts with immediate colleagues.',
        typicalRoles: ['Developer', 'Test Analyst', 'Support Analyst'],
        experience: '1-3 years'
      },
      {
        level: 3,
        name: 'Apply',
        summary: 'Experienced professional, general direction',
        autonomy: 'Works under general direction. Uses substantial discretion.',
        complexity: 'Performs a broad range of complex technical activities.',
        influence: 'Has working level contact with customers and suppliers.',
        typicalRoles: ['Senior Developer', 'Senior Analyst', 'Technical Lead'],
        experience: '3-5 years'
      },
      {
        level: 4,
        name: 'Enable',
        summary: 'Senior professional, broad guidance',
        autonomy: 'Works under general guidance. Substantial responsibility.',
        complexity: 'Performs complex activities covering technical, financial, and quality aspects.',
        influence: 'Influences team and specialist peers. Engages with customers.',
        typicalRoles: ['Lead Developer', 'Solution Designer', 'Project Manager'],
        experience: '5-8 years'
      },
      {
        level: 5,
        name: 'Ensure/Advise',
        summary: 'Manager/senior specialist, broad direction',
        autonomy: 'Works under broad direction. Full accountability.',
        complexity: 'Performs highly complex work activities with broad organisational impact.',
        influence: 'Significant influence on policy and strategic direction.',
        typicalRoles: ['Development Manager', 'Principal Architect', 'Senior PM'],
        experience: '8-12 years'
      },
      {
        level: 6,
        name: 'Initiate/Influence',
        summary: 'Senior manager/director, defined authority',
        autonomy: 'Has defined authority and accountability for actions.',
        complexity: 'Leads highly significant programmes of work.',
        influence: 'Influences policy and strategy formation. External profile.',
        typicalRoles: ['Head of Development', 'CTO', 'Programme Director'],
        experience: '12-15+ years'
      },
      {
        level: 7,
        name: 'Set Strategy/Inspire',
        summary: 'Executive/thought leader, highest authority',
        autonomy: 'Sets organisational objectives and assigns responsibilities.',
        complexity: 'Leads the organisation or major business unit.',
        influence: 'Highest organisational authority in area of specialism.',
        typicalRoles: ['CIO', 'Chief Architect', 'Executive Director'],
        experience: '15+ years'
      }
    ]
  },
  
  permissions: {
    contributor: {
      role: 'Contributor',
      canView: 'Basic rate cards only',
      canFilter: true,
      canExport: false,
      canViewHistory: false,
      canAdmin: false,
      notes: 'Contributors can view rates for planning purposes'
    },
    supplier_pm: {
      role: 'Supplier PM',
      canView: 'All rate cards and history',
      canFilter: true,
      canExport: true,
      canViewHistory: true,
      canAdmin: false,
      notes: 'Supplier PMs can view and export all rate information'
    },
    customer_pm: {
      role: 'Customer PM',
      canView: 'All rate cards and history',
      canFilter: true,
      canExport: true,
      canViewHistory: true,
      canAdmin: false,
      notes: 'Customer PMs can view and export for budget planning'
    },
    admin: {
      role: 'Admin',
      canView: 'All rate cards and history',
      canFilter: true,
      canExport: true,
      canViewHistory: true,
      canAdmin: true,
      notes: 'Admins can manage rate cards and update rates'
    },
    partner_admin: {
      role: 'Partner Admin',
      canView: 'Own tier rates only',
      canFilter: true,
      canExport: false,
      canViewHistory: false,
      canAdmin: false,
      notes: 'Partners see their applicable rates only'
    },
    partner_user: {
      role: 'Partner User',
      canView: 'Limited - no rate visibility',
      canFilter: false,
      canExport: false,
      canViewHistory: false,
      canAdmin: false,
      notes: 'Partner Users do not have access to rate cards'
    }
  },
  
  faq: [
    {
      question: 'How often are rates updated?',
      answer: 'Rate cards are typically reviewed annually or when significant market changes occur. The effective date shows when the current rates became active. Contact your Admin for the next planned review date.'
    },
    {
      question: 'Can I get custom rates?',
      answer: 'Standard rate cards apply to all projects for consistency. Custom rates may be negotiated for large programmes - this requires Admin approval and creates a project-specific rate override documented in the estimate.'
    },
    {
      question: 'What determines which tier to use?',
      answer: 'Tier selection depends on supplier relationship, project requirements, and commercial agreements. Prime tier is for strategic partners, Mid tier for standard delivery, SME for specialist or cost-effective delivery, Contractor for direct individual engagements.'
    },
    {
      question: 'Are rates inclusive of expenses?',
      answer: 'Day rates typically exclude travel and subsistence expenses. Check the rate card notes for specific inclusions. Expenses are tracked separately in the Expenses feature.'
    },
    {
      question: 'How do I find a rate for a specific skill?',
      answer: 'Use the search box to type the skill name or SFIA code. You can also filter by category to narrow down to related skills. Each skill shows rates across all levels and tiers.'
    },
    {
      question: 'What currency are rates in?',
      answer: 'All rates are displayed in GBP (British Pounds). For projects in other currencies, contact your Admin for conversion guidance or local rate cards.'
    },
    {
      question: 'Can I see rates from previous periods?',
      answer: 'Yes, click on any rate cell and select "View History" to see all historical rates with their effective dates. This is useful for understanding rate trends over time.'
    },
    {
      question: 'Why are some skills missing from the rate card?',
      answer: 'The rate card covers the most commonly used SFIA skills. If you need a rate for a skill not shown, contact your Admin who can add it or provide guidance on the closest equivalent.'
    },
    {
      question: 'How do levels relate to job titles?',
      answer: 'SFIA levels map to seniority, not specific job titles. Level 3 is typically "Senior", Level 4 is "Lead/Principal", Level 5 is "Manager/Director". See the level descriptions for detailed guidance.'
    },
    {
      question: 'Can partners see all rate cards?',
      answer: 'Partners typically only see rates applicable to their tier. This maintains commercial confidentiality. Full rate visibility requires PM or Admin access.'
    }
  ],
  
  related: ['estimator', 'wbs-planning', 'resources', 'billing']
};

export default benchmarkingGuide;
