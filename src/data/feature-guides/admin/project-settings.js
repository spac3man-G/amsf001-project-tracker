// Project Settings Feature Guide
// Complete how-to documentation for project configuration

const projectSettingsGuide = {
  id: 'project-settings',
  title: 'Project Settings',
  category: 'admin',
  description: 'Configure project settings including dates, budget, categories, workflows, and integrations. Customise the project to match your delivery methodology and reporting requirements.',
  
  navigation: {
    path: '/admin/project-settings',
    sidebar: 'Admin → Project Settings',
    quickAccess: 'Project Menu → Settings',
    breadcrumb: 'Home > Admin > Project Settings'
  },
  
  howTo: {
    configure: {
      title: 'Configuring Basic Project Settings',
      steps: [
        'Navigate to Admin → Project Settings',
        'Update the project name if needed',
        'Enter or update the project description',
        'Set the project code (short identifier)',
        'Select the project type: Fixed Price, T&M, or Hybrid',
        'Set the project status',
        'Click "Save Settings"'
      ],
      tips: [
        'Project code appears in reports and references',
        'Description helps team members understand project scope',
        'Project type affects billing and reporting features'
      ]
    },
    dates: {
      title: 'Setting Project Dates',
      steps: [
        'Navigate to Admin → Project Settings → Dates',
        'Set the project start date',
        'Set the planned end date',
        'Set the actual end date when project completes',
        'Configure financial year settings if needed',
        'Set reporting period (weekly/monthly)',
        'Save the date configuration'
      ],
      dateFields: [
        { field: 'Start Date', description: 'When the project officially begins' },
        { field: 'Planned End', description: 'Target completion date' },
        { field: 'Actual End', description: 'Real completion date (set when done)' },
        { field: 'Financial Year Start', description: 'For budget year calculations' },
        { field: 'Reporting Period', description: 'Weekly or monthly reporting cycles' }
      ],
      tips: [
        'Dates constrain timesheet entry',
        'Date changes may require baseline updates',
        'Financial year affects budget reporting'
      ]
    },
    budget: {
      title: 'Configuring Project Budget',
      steps: [
        'Navigate to Admin → Project Settings → Budget',
        'Enter the total project budget',
        'Set the budget currency',
        'Configure budget warning thresholds',
        'Set contingency amount or percentage',
        'Enable or disable budget tracking features',
        'Save budget settings'
      ],
      budgetSettings: [
        { setting: 'Total Budget', description: 'Overall project budget allocation' },
        { setting: 'Currency', description: 'Currency for all financial data' },
        { setting: 'Amber Threshold', description: 'Percentage at which amber warning shows' },
        { setting: 'Red Threshold', description: 'Percentage at which red warning shows' },
        { setting: 'Contingency', description: 'Risk allowance amount' },
        { setting: 'Track by Milestone', description: 'Enable milestone-level budget tracking' }
      ],
      tips: [
        'Budget flows down to milestones',
        'Thresholds trigger dashboard warnings',
        'Contingency is tracked separately'
      ]
    },
    categories: {
      title: 'Customising Categories',
      steps: [
        'Navigate to Admin → Project Settings → Categories',
        'View existing categories for each type',
        'Click "Add Category" to create new',
        'Enter category name and optional code',
        'Set display order',
        'Enable or disable categories',
        'Save category configuration'
      ],
      categoryTypes: [
        { type: 'Expense Categories', examples: ['Travel', 'Accommodation', 'Equipment', 'Training'] },
        { type: 'Deliverable Types', examples: ['Document', 'Software', 'Training', 'Service'] },
        { type: 'RAID Categories', examples: ['Technical', 'Resource', 'Commercial', 'Schedule'] },
        { type: 'Variation Types', examples: ['Scope Change', 'Timeline', 'Budget', 'Resource'] }
      ],
      tips: [
        'Categories help organise and filter data',
        'Disabled categories hide from dropdowns',
        'Cannot delete categories with existing items'
      ]
    },
    workflows: {
      title: 'Configuring Approval Workflows',
      steps: [
        'Navigate to Admin → Project Settings → Workflows',
        'Select the workflow to configure (Timesheet, Expense, etc.)',
        'View the workflow stages',
        'Configure approvers for each stage',
        'Set auto-approval rules if applicable',
        'Configure notification settings',
        'Save workflow configuration'
      ],
      configurableWorkflows: [
        { workflow: 'Timesheet', stages: ['Submit', 'Validate', 'Approve'] },
        { workflow: 'Expense', stages: ['Submit', 'Validate', 'Approve'] },
        { workflow: 'Variation', stages: ['Submit', 'Review', 'Approve', 'Implement'] },
        { workflow: 'Deliverable', stages: ['Submit', 'Review', 'Accept'] },
        { workflow: 'Milestone Certificate', stages: ['Request', 'Sign'] }
      ],
      tips: [
        'Workflow changes affect new items only',
        'Ensure approvers are assigned correctly',
        'Test workflows with sample items'
      ]
    },
    notifications: {
      title: 'Setting Up Notifications',
      steps: [
        'Navigate to Admin → Project Settings → Notifications',
        'Configure email notification triggers',
        'Set notification frequency (immediate, daily digest)',
        'Enable or disable specific notification types',
        'Configure reminder settings',
        'Test notifications',
        'Save notification preferences'
      ],
      notificationTypes: [
        { type: 'Approval Required', description: 'When items need your approval' },
        { type: 'Status Changes', description: 'When item status changes' },
        { type: 'Deadline Reminders', description: 'Upcoming due dates' },
        { type: 'Budget Alerts', description: 'Budget threshold warnings' },
        { type: 'Assignment', description: 'When work is assigned to you' },
        { type: 'Comments', description: 'When someone comments on your items' }
      ],
      tips: [
        'Too many notifications can be overwhelming',
        'Daily digest consolidates multiple alerts',
        'Critical alerts always send immediately'
      ]
    },
    integrations: {
      title: 'Managing Integrations',
      steps: [
        'Navigate to Admin → Project Settings → Integrations',
        'View available integrations',
        'Click "Configure" on the integration you want',
        'Enter required credentials or API keys',
        'Configure sync settings',
        'Test the connection',
        'Enable the integration'
      ],
      availableIntegrations: [
        { integration: 'Calendar', description: 'Sync deadlines and workshops to calendar' },
        { integration: 'File Storage', description: 'Connect to document storage' },
        { integration: 'Communication', description: 'Integrate with Slack/Teams' },
        { integration: 'Finance', description: 'Export to finance systems' }
      ],
      tips: [
        'Test integrations before going live',
        'Keep API keys secure',
        'Review sync logs for errors'
      ]
    },
    partners: {
      title: 'Configuring Partner Settings',
      steps: [
        'Navigate to Admin → Project Settings → Partners',
        'View existing partners on the project',
        'Click "Add Partner" to add a new partner organisation',
        'Configure partner access and permissions',
        'Set up partner rate cards',
        'Configure partner invoice settings',
        'Save partner configuration'
      ],
      partnerSettings: [
        { setting: 'Partner Organisation', description: 'Link to partner org in system' },
        { setting: 'Access Level', description: 'What project data partners can see' },
        { setting: 'Rate Card', description: 'Day rates for partner resources' },
        { setting: 'Invoice Terms', description: 'Payment terms for partner invoices' },
        { setting: 'Notifications', description: 'What alerts partners receive' }
      ],
      tips: [
        'Partners see only their allocated work by default',
        'Rate cards can differ per partner',
        'Review partner access regularly'
      ]
    },
    view: {
      title: 'Viewing Current Settings',
      steps: [
        'Navigate to Admin → Project Settings',
        'The overview shows all current settings',
        'Click any section to expand details',
        'Use "Export Settings" to save configuration',
        'Review settings regularly for accuracy'
      ],
      tips: [
        'Export settings for backup',
        'Compare settings across projects',
        'Document reasons for custom settings'
      ]
    }
  },
  
  fields: {
    project_name: {
      name: 'Project Name',
      label: 'Name',
      required: true,
      type: 'text',
      description: 'The display name for the project',
      validation: 'Required. Maximum 200 characters.',
      tips: 'Use clear, descriptive name'
    },
    project_code: {
      name: 'Project Code',
      label: 'Code',
      required: true,
      type: 'text',
      description: 'Short identifier for the project',
      validation: 'Required. Maximum 20 characters. Alphanumeric.',
      tips: 'Used in reports and references. Keep it short.'
    },
    description: {
      name: 'Description',
      label: 'Description',
      required: false,
      type: 'textarea',
      description: 'Detailed description of the project',
      validation: 'Maximum 5000 characters.',
      tips: 'Include scope, objectives, key information'
    },
    project_type: {
      name: 'Project Type',
      label: 'Type',
      required: true,
      type: 'select',
      description: 'Commercial model for the project',
      values: ['Fixed Price', 'Time & Materials', 'Hybrid'],
      tips: 'Affects billing and reporting features'
    },
    status: {
      name: 'Status',
      label: 'Status',
      required: true,
      type: 'select',
      description: 'Current project status',
      values: ['Setup', 'Active', 'On Hold', 'Complete', 'Cancelled'],
      tips: 'Status affects available features'
    },
    start_date: {
      name: 'Start Date',
      label: 'Start Date',
      required: true,
      type: 'date',
      description: 'When the project officially starts',
      validation: 'Required.',
      tips: 'Timesheets cannot be before this date'
    },
    end_date: {
      name: 'End Date',
      label: 'Planned End Date',
      required: true,
      type: 'date',
      description: 'Target completion date',
      validation: 'Required. Must be after start date.',
      tips: 'Used for planning and reporting'
    },
    budget: {
      name: 'Budget',
      label: 'Total Budget',
      required: false,
      type: 'currency',
      description: 'Total project budget allocation',
      validation: 'Must be positive if provided.',
      tips: 'Flows down to milestone budgets'
    },
    currency: {
      name: 'Currency',
      label: 'Currency',
      required: true,
      type: 'select',
      description: 'Currency for all project financials',
      values: ['GBP', 'USD', 'EUR', 'AUD'],
      tips: 'Cannot be changed after financial data exists'
    }
  },
  
  permissions: {
    contributor: {
      role: 'Contributor',
      canView: 'Basic settings only',
      canEdit: false,
      notes: 'Contributors can see project dates and description'
    },
    supplier_pm: {
      role: 'Supplier PM',
      canView: true,
      canEdit: 'Most settings',
      notes: 'Supplier PMs can configure most project settings'
    },
    customer_pm: {
      role: 'Customer PM',
      canView: true,
      canEdit: 'Limited settings',
      notes: 'Customer PMs can view but have limited edit access'
    },
    admin: {
      role: 'Admin',
      canView: true,
      canEdit: 'All settings',
      notes: 'Admins have full access to all project settings'
    },
    partner_admin: {
      role: 'Partner Admin',
      canView: 'Partner-relevant settings',
      canEdit: false,
      notes: 'Partners can view settings that affect their work'
    },
    partner_user: {
      role: 'Partner User',
      canView: 'Minimal',
      canEdit: false,
      notes: 'Partner users see basic project info only'
    }
  },
  
  faq: [
    {
      question: 'Can I change the project dates after the project starts?',
      answer: 'Yes, but be careful. Changing dates may affect existing timesheets and expense validity. Consider using variations to formally document timeline changes.'
    },
    {
      question: 'What happens if I change the currency?',
      answer: 'Currency cannot be changed once financial data (timesheets, expenses, invoices) exists. Set the correct currency during project setup.'
    },
    {
      question: 'How do budget thresholds work?',
      answer: 'When spend reaches the amber threshold (e.g., 80%), amber warnings appear. At the red threshold (e.g., 100%), red warnings show. Thresholds are configurable per project.'
    },
    {
      question: 'Can I copy settings from another project?',
      answer: 'Yes, when creating a new project you can use an existing project as a template. This copies categories, workflows, and other settings.'
    },
    {
      question: 'How do I add a new expense category?',
      answer: 'Go to Project Settings → Categories → Expense Categories. Click "Add Category", enter the name, and save. The new category becomes available immediately.'
    },
    {
      question: 'What settings can partners see?',
      answer: 'Partners can see project dates, their assigned milestones, and settings relevant to their work (like categories). They cannot see budget details or other partners.'
    },
    {
      question: 'How do I enable/disable features for this project?',
      answer: 'Some features can be toggled in Project Settings → Features. For example, you can disable the Evaluator module if not needed for this project.'
    },
    {
      question: 'Can I change workflow stages?',
      answer: 'You can configure who approves at each stage, but the basic workflow structure (Submit → Validate → Approve) is fixed to ensure consistency.'
    }
  ],
  
  related: ['organisation-admin', 'team-members', 'workflows', 'billing']
};

export default projectSettingsGuide;
