// Evaluation Setup Feature Guide
// Complete how-to documentation for software evaluation project setup

const evaluationSetupGuide = {
  id: 'evaluation-setup',
  title: 'Evaluation Setup',
  category: 'evaluator',
  description: 'Set up and configure software evaluation projects. Define evaluation criteria, scoring methods, stakeholder areas, and team structure for systematic vendor assessment and selection.',
  
  navigation: {
    path: '/evaluator',
    sidebar: 'Evaluator → Overview',
    quickAccess: 'Dashboard → Active Evaluations widget',
    breadcrumb: 'Home > Evaluator > Overview'
  },
  
  howTo: {
    create: {
      title: 'Creating a New Evaluation',
      steps: [
        'Navigate to the Evaluator section from the sidebar',
        'Click "New Evaluation" button in the top right',
        'Enter the evaluation name (e.g., "CRM System Selection 2026")',
        'Enter a description explaining the evaluation purpose and scope',
        'Set the evaluation start date',
        'Set the target completion date',
        'Select the evaluation type: Software Selection, Vendor Assessment, or Technology Review',
        'Click "Create Evaluation" to proceed to configuration'
      ],
      tips: [
        'Use clear, descriptive names that identify the evaluation purpose',
        'Set realistic dates allowing time for all evaluation phases',
        'Description should outline key objectives and success criteria',
        'You can modify settings after creation'
      ]
    },
    configure: {
      title: 'Configuring Evaluation Settings',
      steps: [
        'After creating an evaluation, you\'re taken to the Settings page',
        'Configure the Scoring Method (see scoring methods below)',
        'Set up Requirement Categories for organising criteria',
        'Define Stakeholder Areas for different evaluation perspectives',
        'Configure weighting if using weighted scoring',
        'Set deadlines for each evaluation phase',
        'Configure notification preferences',
        'Click "Save Settings" to apply configuration'
      ],
      configurationSections: [
        { section: 'General', description: 'Name, description, dates, status' },
        { section: 'Scoring', description: 'Method, scale, weights, thresholds' },
        { section: 'Categories', description: 'Requirement categories and weights' },
        { section: 'Stakeholders', description: 'Stakeholder areas and evaluators' },
        { section: 'Phases', description: 'Phase dates and milestones' },
        { section: 'Notifications', description: 'Email alerts and reminders' }
      ],
      tips: [
        'Complete configuration before adding requirements',
        'Category weights should sum to 100%',
        'Consider pilot testing scoring with a sample vendor'
      ]
    },
    scoringMethod: {
      title: 'Choosing a Scoring Method',
      steps: [
        'Go to Settings → Scoring in your evaluation',
        'Review the available scoring methods',
        'Select the method that best fits your evaluation needs',
        'Configure method-specific settings',
        'Set the scoring scale (typically 0-5)',
        'Define what each score level means',
        'Save your scoring configuration'
      ],
      scoringMethods: [
        {
          method: 'Simple Average',
          description: 'All requirements weighted equally. Final score is average of all scores.',
          bestFor: 'Quick assessments, simple evaluations',
          configuration: 'No additional configuration needed'
        },
        {
          method: 'Weighted',
          description: 'Categories and/or requirements have different weights. Weighted average calculation.',
          bestFor: 'Most evaluations - allows prioritisation of important criteria',
          configuration: 'Set category weights (must sum to 100%)'
        },
        {
          method: 'MoSCoW Weighted',
          description: 'Requirements prioritised as Must/Should/Could/Won\'t with automatic weighting.',
          bestFor: 'Requirements-driven evaluations',
          configuration: 'Set weight multipliers for each MoSCoW level'
        },
        {
          method: 'Consensus',
          description: 'Team discusses and agrees on single scores together.',
          bestFor: 'Smaller teams, collaborative decision making',
          configuration: 'Define consensus rules and facilitator'
        },
        {
          method: 'Multi-Stakeholder',
          description: 'Different stakeholder groups score separately, then combined.',
          bestFor: 'Complex evaluations with diverse stakeholder interests',
          configuration: 'Set stakeholder area weights'
        }
      ],
      tips: [
        'Weighted scoring is recommended for most evaluations',
        'Document the rationale for your scoring method choice',
        'Ensure evaluators understand the method before scoring begins'
      ]
    },
    categories: {
      title: 'Setting Up Requirement Categories',
      steps: [
        'Go to Settings → Categories in your evaluation',
        'Review default categories or start fresh',
        'Click "Add Category" to create a new category',
        'Enter the category name (e.g., "Functional Requirements")',
        'Enter a description explaining what belongs in this category',
        'Set the category weight (percentage of total score)',
        'Set display order for how categories appear',
        'Repeat for each category needed',
        'Ensure weights sum to 100%'
      ],
      defaultCategories: [
        { name: 'Functional Requirements', description: 'Core features and capabilities', suggestedWeight: 40 },
        { name: 'Technical Requirements', description: 'Architecture, integration, security', suggestedWeight: 25 },
        { name: 'Vendor Viability', description: 'Company stability, support, roadmap', suggestedWeight: 15 },
        { name: 'Commercial', description: 'Pricing, licensing, contract terms', suggestedWeight: 15 },
        { name: 'Implementation', description: 'Deployment, training, timeline', suggestedWeight: 5 }
      ],
      tips: [
        'Start with default categories and customise as needed',
        'Keep categories broad enough to group related requirements',
        '5-8 categories is typical for most evaluations',
        'Higher weights indicate more important categories'
      ]
    },
    stakeholders: {
      title: 'Configuring Stakeholder Areas',
      steps: [
        'Go to Settings → Stakeholders in your evaluation',
        'Click "Add Stakeholder Area" to define a perspective',
        'Enter the area name (e.g., "Business Users", "IT", "Finance")',
        'Enter a description of this stakeholder perspective',
        'Set the area weight for multi-stakeholder scoring',
        'Add evaluators to this stakeholder area',
        'Repeat for each stakeholder perspective',
        'Ensure area weights sum to 100% if using weighted stakeholders'
      ],
      stakeholderAreas: [
        { name: 'Business Users', description: 'End users who will use the system daily', focus: 'Usability, features' },
        { name: 'IT / Technical', description: 'Technical team responsible for implementation', focus: 'Architecture, security, integration' },
        { name: 'Finance', description: 'Finance team evaluating cost and ROI', focus: 'TCO, licensing, commercial terms' },
        { name: 'Management', description: 'Senior stakeholders for strategic fit', focus: 'Vendor viability, strategic alignment' },
        { name: 'Compliance', description: 'Risk and compliance reviewers', focus: 'Security, data protection, audit' }
      ],
      tips: [
        'Match stakeholder areas to your organisation structure',
        'Each area should have at least one evaluator assigned',
        'Consider which requirements each area should score'
      ]
    },
    inviteTeam: {
      title: 'Inviting Evaluation Team Members',
      steps: [
        'Go to Settings → Team in your evaluation',
        'Click "Invite Member" to add a team member',
        'Enter the person\'s email address',
        'Select their role: Evaluator, Reviewer, or Admin',
        'Assign them to a stakeholder area (for Evaluators)',
        'Add optional message explaining their role',
        'Click "Send Invitation"',
        'The invitee receives an email with access link',
        'Track invitation status in the Team list'
      ],
      roles: [
        {
          role: 'Evaluation Admin',
          description: 'Full control over evaluation setup and management',
          permissions: 'All settings, all scoring, all reports, manage team'
        },
        {
          role: 'Evaluator',
          description: 'Scores vendors against requirements',
          permissions: 'View requirements, score assigned vendors, view own scores'
        },
        {
          role: 'Reviewer',
          description: 'Reviews scores and results but doesn\'t score',
          permissions: 'View requirements, view all scores, view reports'
        },
        {
          role: 'Observer',
          description: 'Read-only access to evaluation progress',
          permissions: 'View summary only, no detailed scores'
        }
      ],
      tips: [
        'Invite all evaluators before scoring begins',
        'Provide clear instructions about their role and timeline',
        'Consider scheduling a kickoff meeting to brief the team'
      ]
    },
    phases: {
      title: 'Setting Up Evaluation Phases',
      steps: [
        'Go to Settings → Phases in your evaluation',
        'Review the default phase structure',
        'Adjust phase names and dates as needed',
        'Set dependencies between phases',
        'Configure phase milestones and deliverables',
        'Set notification triggers for phase transitions',
        'Save the phase configuration'
      ],
      defaultPhases: [
        { phase: 'Setup', description: 'Define requirements and invite vendors', duration: '1-2 weeks' },
        { phase: 'Information Gathering', description: 'Vendors submit responses and demos', duration: '2-4 weeks' },
        { phase: 'Evaluation', description: 'Team scores vendors against requirements', duration: '1-2 weeks' },
        { phase: 'Analysis', description: 'Review scores, conduct workshops, shortlist', duration: '1 week' },
        { phase: 'Selection', description: 'Final decision and recommendation', duration: '1 week' }
      ],
      tips: [
        'Build in buffer time for delays',
        'Align phases with vendor availability for demos',
        'Set clear deadlines for each phase'
      ]
    },
    view: {
      title: 'Viewing Evaluation Dashboard',
      steps: [
        'Navigate to your evaluation from the Evaluator section',
        'The Overview dashboard shows evaluation status at a glance',
        'Progress cards show: Requirements, Vendors, Scoring completion',
        'Timeline shows current phase and upcoming milestones',
        'Quick actions provide shortcuts to common tasks',
        'Activity feed shows recent team activity',
        'Use tabs to navigate to specific areas: Requirements, Vendors, Scoring, Reports'
      ],
      dashboardWidgets: [
        { widget: 'Progress Overview', description: 'Visual progress across all phases' },
        { widget: 'Scoring Status', description: 'Completion percentage by evaluator' },
        { widget: 'Vendor Summary', description: 'Current rankings preview' },
        { widget: 'Upcoming Deadlines', description: 'Next milestones and due dates' },
        { widget: 'Recent Activity', description: 'Team actions and updates' }
      ],
      tips: [
        'Check dashboard daily during active evaluation',
        'Use activity feed to track team engagement',
        'Export dashboard summary for status reports'
      ]
    },
    duplicate: {
      title: 'Duplicating an Evaluation',
      steps: [
        'Navigate to the evaluation you want to duplicate',
        'Click the "..." menu in the top right',
        'Select "Duplicate Evaluation"',
        'Enter a name for the new evaluation',
        'Choose what to copy: Settings, Categories, Requirements, Stakeholders',
        'Clear or keep vendor information as needed',
        'Click "Create Duplicate"',
        'The new evaluation opens for editing'
      ],
      tips: [
        'Useful for similar recurring evaluations',
        'Always clear sensitive vendor information when duplicating',
        'Review and update dates after duplicating'
      ]
    },
    archive: {
      title: 'Archiving a Completed Evaluation',
      steps: [
        'Ensure the evaluation is complete with final report generated',
        'Go to Settings → General',
        'Click "Archive Evaluation"',
        'Confirm the archive action',
        'Archived evaluations move to the Archive section',
        'Archived evaluations are read-only but fully accessible',
        'Can be restored if needed'
      ],
      tips: [
        'Archive after decision is made and documented',
        'Archived evaluations don\'t appear in active lists',
        'Data is preserved for audit and reference'
      ]
    }
  },
  
  fields: {
    evaluation_name: {
      name: 'Evaluation Name',
      label: 'Name',
      required: true,
      type: 'text',
      description: 'The name of this evaluation project',
      validation: 'Required. Maximum 200 characters.',
      tips: 'Use descriptive name including year or purpose'
    },
    description: {
      name: 'Description',
      label: 'Description',
      required: true,
      type: 'textarea',
      description: 'Detailed description of evaluation purpose and scope',
      validation: 'Required. Maximum 5000 characters.',
      tips: 'Include objectives, scope boundaries, and success criteria'
    },
    evaluation_type: {
      name: 'Evaluation Type',
      label: 'Type',
      required: true,
      type: 'select',
      description: 'The type of evaluation being conducted',
      values: ['Software Selection', 'Vendor Assessment', 'Technology Review', 'RFP Response Evaluation'],
      tips: 'Type affects default templates and workflows'
    },
    status: {
      name: 'Status',
      label: 'Status',
      required: false,
      type: 'readonly',
      description: 'Current status of the evaluation',
      values: ['Draft', 'Setup', 'In Progress', 'Analysis', 'Complete', 'Archived'],
      tips: 'Status updates as evaluation progresses through phases'
    },
    start_date: {
      name: 'Start Date',
      label: 'Start Date',
      required: true,
      type: 'date',
      description: 'When the evaluation begins',
      validation: 'Required.',
      tips: 'Usually when requirements definition starts',
      format: 'DD/MM/YYYY'
    },
    target_date: {
      name: 'Target Completion Date',
      label: 'Target Date',
      required: true,
      type: 'date',
      description: 'Target date for evaluation completion',
      validation: 'Required. Must be after start date.',
      tips: 'Allow adequate time for all phases',
      format: 'DD/MM/YYYY'
    },
    scoring_method: {
      name: 'Scoring Method',
      label: 'Scoring Method',
      required: true,
      type: 'select',
      description: 'How vendor scores will be calculated',
      values: ['Simple Average', 'Weighted', 'MoSCoW Weighted', 'Consensus', 'Multi-Stakeholder'],
      tips: 'Weighted is recommended for most evaluations'
    },
    scoring_scale: {
      name: 'Scoring Scale',
      label: 'Scale',
      required: true,
      type: 'select',
      description: 'The numeric scale for scoring',
      values: ['0-3', '0-5', '0-10', '1-5', '1-10'],
      tips: '0-5 is most common. Larger scales allow finer differentiation.'
    },
    category_name: {
      name: 'Category Name',
      label: 'Category',
      required: true,
      type: 'text',
      description: 'Name of the requirement category',
      validation: 'Required. Must be unique within evaluation.',
      tips: 'Keep names concise but descriptive'
    },
    category_weight: {
      name: 'Category Weight',
      label: 'Weight (%)',
      required: true,
      type: 'percentage',
      description: 'Weight of this category in overall scoring',
      validation: 'Required. All weights must sum to 100%.',
      tips: 'Higher weight = more impact on final score'
    },
    stakeholder_area: {
      name: 'Stakeholder Area',
      label: 'Area',
      required: true,
      type: 'text',
      description: 'Name of the stakeholder perspective',
      validation: 'Required. Must be unique within evaluation.',
      tips: 'Align with organisational structure'
    },
    stakeholder_weight: {
      name: 'Stakeholder Weight',
      label: 'Weight (%)',
      required: false,
      type: 'percentage',
      description: 'Weight of this stakeholder area in multi-stakeholder scoring',
      validation: 'All weights must sum to 100% if using weighted stakeholders.',
      tips: 'Only used for multi-stakeholder scoring method'
    }
  },
  
  scoringScales: {
    title: 'Scoring Scale Definitions',
    description: 'Standard definitions for each score level help ensure consistent scoring across evaluators.',
    scales: {
      '0-5': [
        { score: 0, label: 'Not Met', description: 'Requirement not addressed or completely fails to meet need' },
        { score: 1, label: 'Minimally Met', description: 'Significant gaps or major concerns' },
        { score: 2, label: 'Partially Met', description: 'Meets some aspects but notable gaps remain' },
        { score: 3, label: 'Adequately Met', description: 'Meets the requirement with minor gaps or concerns' },
        { score: 4, label: 'Fully Met', description: 'Completely meets the requirement' },
        { score: 5, label: 'Exceeds', description: 'Exceeds the requirement with additional value' }
      ]
    },
    tips: [
      'Discuss scale definitions with evaluators before scoring',
      'Document any organisation-specific interpretations',
      'Consider half-points if finer granularity needed'
    ]
  },
  
  workflow: {
    title: 'Evaluation Lifecycle',
    description: 'Evaluations progress through defined phases from setup to completion.',
    diagram: `
    ┌─────────┐    ┌─────────┐    ┌─────────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │  Draft  │ -> │  Setup  │ -> │ In Progress │ -> │ Analysis │ -> │ Complete │ -> │ Archived │
    └─────────┘    └─────────┘    └─────────────┘    └──────────┘    └──────────┘    └──────────┘
         │              │               │                  │               │
         │         Requirements    Scoring            Workshops       Decision
         │         Vendors         Demos              Reports         Report
         │         Team
    `,
    phases: [
      { 
        name: 'Draft', 
        description: 'Initial creation, not yet started',
        activities: ['Create evaluation', 'Basic configuration'],
        exit: 'Start Setup phase'
      },
      { 
        name: 'Setup', 
        description: 'Defining requirements and inviting participants',
        activities: ['Configure settings', 'Define requirements', 'Invite vendors', 'Build team'],
        exit: 'All requirements defined, vendors invited'
      },
      { 
        name: 'In Progress', 
        description: 'Active scoring and vendor interaction',
        activities: ['Vendor demos', 'Evaluator scoring', 'Q&A with vendors'],
        exit: 'All scoring complete'
      },
      { 
        name: 'Analysis', 
        description: 'Reviewing results and making recommendation',
        activities: ['Score analysis', 'Consensus workshops', 'Shortlisting', 'Reference checks'],
        exit: 'Recommendation documented'
      },
      { 
        name: 'Complete', 
        description: 'Evaluation finished with decision made',
        activities: ['Final report', 'Decision documentation', 'Stakeholder communication'],
        exit: 'Archive when appropriate'
      },
      { 
        name: 'Archived', 
        description: 'Historical record preserved',
        activities: ['Read-only access', 'Audit reference'],
        exit: 'Can be restored if needed'
      }
    ]
  },
  
  permissions: {
    contributor: {
      role: 'Contributor',
      canView: false,
      canCreate: false,
      canConfigure: false,
      canInvite: false,
      notes: 'Contributors do not have access to Evaluator module'
    },
    supplier_pm: {
      role: 'Supplier PM',
      canView: true,
      canCreate: true,
      canConfigure: true,
      canInvite: true,
      notes: 'Supplier PMs can set up and manage evaluations'
    },
    customer_pm: {
      role: 'Customer PM',
      canView: true,
      canCreate: true,
      canConfigure: true,
      canInvite: true,
      notes: 'Customer PMs typically lead evaluation setup'
    },
    admin: {
      role: 'Admin',
      canView: true,
      canCreate: true,
      canConfigure: true,
      canInvite: true,
      notes: 'Admins have full access to all evaluation functions'
    },
    partner_admin: {
      role: 'Partner Admin',
      canView: false,
      canCreate: false,
      canConfigure: false,
      canInvite: false,
      notes: 'Partners do not have access to Evaluator module'
    },
    partner_user: {
      role: 'Partner User',
      canView: false,
      canCreate: false,
      canConfigure: false,
      canInvite: false,
      notes: 'Partners do not have access to Evaluator module'
    },
    evaluation_roles: {
      description: 'Within an evaluation, users have specific evaluation roles',
      roles: [
        { role: 'Evaluation Admin', permissions: 'Full control of evaluation' },
        { role: 'Evaluator', permissions: 'Score vendors, view requirements' },
        { role: 'Reviewer', permissions: 'View scores and reports' },
        { role: 'Observer', permissions: 'View summary only' }
      ]
    }
  },
  
  faq: [
    {
      question: 'How do I choose the right scoring method?',
      answer: 'Weighted scoring is recommended for most evaluations as it allows prioritisation. Use Simple Average for quick assessments. Use Consensus for smaller teams that can meet together. Use Multi-Stakeholder when different groups have different priorities.'
    },
    {
      question: 'Can I change the scoring method after scoring starts?',
      answer: 'Changing the scoring method after scoring has begun is not recommended as it may invalidate existing scores. If essential, you\'ll need to reset all scores and have evaluators re-score.'
    },
    {
      question: 'How many categories should I have?',
      answer: 'Typically 5-8 categories provides good organisation without being overwhelming. Too few categories make it hard to differentiate. Too many categories make weighting and scoring complex.'
    },
    {
      question: 'What if my category weights don\'t add to 100%?',
      answer: 'The system will warn you if weights don\'t sum to 100%. You must adjust weights until they total exactly 100% before saving. This ensures mathematically valid weighted scoring.'
    },
    {
      question: 'Can evaluators see each other\'s scores?',
      answer: 'By default, evaluators only see their own scores during the evaluation phase. Admins can see all scores. After evaluation completes, consolidated results can be shared with the team.'
    },
    {
      question: 'How do I handle latecomers to the evaluation team?',
      answer: 'You can invite new team members at any time. They\'ll receive access and can begin scoring. However, ensure they have time to complete scoring before deadlines.'
    },
    {
      question: 'Can I run multiple evaluations simultaneously?',
      answer: 'Yes, you can have multiple active evaluations. Each is completely separate with its own team, vendors, and scores. Users can be part of multiple evaluation teams.'
    },
    {
      question: 'What happens to the data when I archive an evaluation?',
      answer: 'Archived evaluations are preserved in read-only mode. All data, scores, and documents remain accessible for reference and audit. You can restore an archived evaluation if needed.'
    },
    {
      question: 'How do I share evaluation results with stakeholders?',
      answer: 'Use the Reports section to generate summary or detailed reports. Reports can be exported as PDF for sharing. You can also invite stakeholders as Observers for direct access to summaries.'
    },
    {
      question: 'Can vendors see their own scores?',
      answer: 'Vendors do not have access to scores during the evaluation. After selection, you may choose to share feedback with vendors as part of debrief, but this is manual and at your discretion.'
    }
  ],
  
  related: ['requirements', 'vendors', 'scoring', 'workshops', 'evaluator-reports']
};

export default evaluationSetupGuide;
