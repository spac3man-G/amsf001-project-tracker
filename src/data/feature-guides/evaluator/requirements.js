// Requirements Feature Guide
// Complete how-to documentation for evaluation requirements management

const requirementsGuide = {
  id: 'requirements',
  title: 'Evaluation Requirements',
  category: 'evaluator',
  description: 'Define, organise, and manage evaluation requirements. Create requirements manually, use AI assistance, or import from documents. Prioritise using MoSCoW and organise by category for systematic vendor assessment.',
  
  navigation: {
    path: '/evaluator/:id/requirements',
    sidebar: 'Evaluator → [Evaluation] → Requirements',
    quickAccess: 'Evaluation Dashboard → Requirements card',
    breadcrumb: 'Home > Evaluator > [Evaluation Name] > Requirements'
  },
  
  howTo: {
    create: {
      title: 'Creating Requirements Manually',
      steps: [
        'Navigate to your evaluation\'s Requirements page',
        'Click "Add Requirement" button',
        'Enter a clear, specific requirement title',
        'Select the category this requirement belongs to',
        'Set the MoSCoW priority: Must, Should, Could, or Won\'t',
        'Add a detailed description explaining the requirement',
        'Add acceptance criteria (how to verify the requirement is met)',
        'Set the weight (if using weighted scoring within categories)',
        'Click "Save Requirement"'
      ],
      tips: [
        'Write requirements as specific, measurable criteria',
        'One concept per requirement - avoid compound requirements',
        'Include rationale in the description',
        'Acceptance criteria help evaluators score consistently'
      ]
    },
    aiGenerate: {
      title: 'Using AI to Generate Requirements',
      steps: [
        'From the Requirements page, click "AI Generate"',
        'Choose the generation method: From Description, From Document, or From Template',
        'For Description: Enter a detailed description of what you need',
        'For Document: Upload a requirements document, RFP, or specification',
        'For Template: Select an industry template (e.g., CRM, ERP, ITSM)',
        'Click "Generate" to create AI suggestions',
        'Review the generated requirements in the preview',
        'Select which requirements to keep, modify, or discard',
        'Click "Add Selected" to import chosen requirements',
        'Review and refine the imported requirements'
      ],
      aiMethods: [
        { method: 'From Description', description: 'AI generates requirements from your text description' },
        { method: 'From Document', description: 'AI extracts and structures requirements from uploaded documents' },
        { method: 'From Template', description: 'AI provides industry-standard requirements as starting point' }
      ],
      tips: [
        'AI suggestions are a starting point - always review and refine',
        'More detailed descriptions produce better AI results',
        'Combine AI generation with manual requirements',
        'Upload existing RFP documents for fastest results'
      ]
    },
    import: {
      title: 'Importing Requirements from Documents',
      steps: [
        'From the Requirements page, click "Import"',
        'Select the import source: Excel, CSV, or Document',
        'For Excel/CSV: Upload your file and map columns',
        'For Document (Word/PDF): AI will extract requirements',
        'Review the import preview',
        'Map imported fields to requirement fields',
        'Set default category and priority for unmapped items',
        'Click "Import" to add requirements',
        'Review and adjust imported requirements'
      ],
      importFormats: [
        { format: 'Excel (.xlsx)', description: 'Spreadsheet with columns for title, description, category, priority' },
        { format: 'CSV (.csv)', description: 'Comma-separated file with requirement data' },
        { format: 'Word (.docx)', description: 'Document with requirements - AI extracts structure' },
        { format: 'PDF (.pdf)', description: 'PDF document - AI extracts and structures content' }
      ],
      tips: [
        'Download the Excel template for correct formatting',
        'Include category and priority columns for better mapping',
        'AI extraction works best with structured documents',
        'Review all imported requirements for accuracy'
      ]
    },
    categorise: {
      title: 'Organising Requirements by Category',
      steps: [
        'Each requirement must belong to a category',
        'Select the category when creating or editing a requirement',
        'Use the Category filter to view requirements in one category',
        'Drag and drop to move requirements between categories',
        'Bulk select requirements and use "Move to Category" action',
        'Review category totals in the summary bar'
      ],
      tips: [
        'Categories should be defined in Evaluation Settings first',
        'Balance requirements across categories',
        'Category weights affect overall scoring',
        'Consider vendor capability areas when categorising'
      ]
    },
    prioritise: {
      title: 'Setting MoSCoW Priorities',
      steps: [
        'Select the requirement to edit',
        'Choose the MoSCoW priority from the dropdown',
        'Must Have: Essential requirement, evaluation fails without it',
        'Should Have: Important but not critical for success',
        'Could Have: Desirable but not necessary',
        'Won\'t Have: Out of scope for this evaluation',
        'Save the requirement',
        'Use priority filters to review requirements by importance'
      ],
      moscow: [
        { 
          priority: 'Must Have', 
          code: 'M',
          description: 'Non-negotiable requirements. Vendors must meet these to be considered.',
          weight: 'Highest weight in MoSCoW scoring',
          colour: 'Red'
        },
        { 
          priority: 'Should Have', 
          code: 'S',
          description: 'Important requirements that add significant value.',
          weight: 'High weight in MoSCoW scoring',
          colour: 'Orange'
        },
        { 
          priority: 'Could Have', 
          code: 'C',
          description: 'Nice-to-have requirements if time and budget allow.',
          weight: 'Medium weight in MoSCoW scoring',
          colour: 'Yellow'
        },
        { 
          priority: 'Won\'t Have', 
          code: 'W',
          description: 'Explicitly out of scope. May be considered for future.',
          weight: 'Not scored (weight = 0)',
          colour: 'Grey'
        }
      ],
      tips: [
        'Be selective with Must Have - too many reduces differentiation',
        'Won\'t Have clarifies scope boundaries',
        'Review priorities with stakeholders before scoring',
        'MoSCoW affects weighted scoring calculations'
      ]
    },
    approve: {
      title: 'Approving Requirements for Scoring',
      steps: [
        'Review all requirements for completeness and clarity',
        'Ensure categories and priorities are set correctly',
        'Verify total requirements is manageable for evaluators',
        'Get stakeholder sign-off on the requirement set',
        'Click "Finalize Requirements" to lock for scoring',
        'Confirm the finalization action',
        'Requirements are now locked - changes require approval'
      ],
      tips: [
        'Finalized requirements cannot be easily changed',
        'Ensure all stakeholders have reviewed before finalizing',
        '50-100 requirements is typical for comprehensive evaluations',
        'Too many requirements causes evaluator fatigue'
      ]
    },
    edit: {
      title: 'Editing Requirements',
      steps: [
        'Click on a requirement row to open details',
        'Or click the edit icon on the requirement',
        'Make changes to any field',
        'Click "Save" to apply changes',
        'For finalized requirements, changes require approval workflow'
      ],
      editableFields: [
        'Title', 'Description', 'Acceptance Criteria', 
        'Category', 'Priority', 'Weight', 'Notes'
      ],
      tips: [
        'Draft requirements can be freely edited',
        'Track changes for audit purposes',
        'Major changes may require re-scoring'
      ]
    },
    bulkEdit: {
      title: 'Bulk Editing Requirements',
      steps: [
        'Use checkboxes to select multiple requirements',
        'Or use "Select All" for the current view',
        'Click "Bulk Actions" dropdown',
        'Choose action: Change Category, Change Priority, Delete',
        'Confirm the bulk action',
        'Changes apply to all selected requirements'
      ],
      bulkActions: [
        { action: 'Change Category', description: 'Move selected to a different category' },
        { action: 'Change Priority', description: 'Set same priority for all selected' },
        { action: 'Delete', description: 'Remove selected requirements' },
        { action: 'Export Selected', description: 'Export selected to Excel' }
      ],
      tips: [
        'Use filters first to select related requirements',
        'Preview affected count before confirming',
        'Bulk delete requires confirmation'
      ]
    },
    view: {
      title: 'Viewing and Filtering Requirements',
      steps: [
        'Navigate to the Requirements page for your evaluation',
        'Use the Category filter to show specific categories',
        'Use the Priority filter for MoSCoW priorities',
        'Use the Status filter for draft/approved requirements',
        'Use the Search box to find by text',
        'Click column headers to sort',
        'Toggle between List and Card views',
        'Export filtered view to Excel'
      ],
      views: [
        { view: 'List View', description: 'Table format with sortable columns' },
        { view: 'Card View', description: 'Visual cards grouped by category' },
        { view: 'Matrix View', description: 'Requirements vs vendors grid' }
      ],
      tips: [
        'Save frequently used filters as views',
        'Export for offline review',
        'Card view helps visualize category balance'
      ]
    }
  },
  
  fields: {
    title: {
      name: 'Title',
      label: 'Requirement Title',
      required: true,
      type: 'text',
      description: 'Clear, concise statement of the requirement',
      validation: 'Required. Maximum 200 characters.',
      tips: 'Start with a verb: "Support...", "Provide...", "Enable..."',
      examples: [
        'Support single sign-on (SSO) authentication',
        'Provide real-time dashboard reporting',
        'Enable bulk data import from CSV files'
      ]
    },
    description: {
      name: 'Description',
      label: 'Description',
      required: true,
      type: 'textarea',
      description: 'Detailed explanation of what is required and why',
      validation: 'Required. Maximum 5000 characters.',
      tips: 'Include context, rationale, and specific details'
    },
    category_id: {
      name: 'Category',
      label: 'Category',
      required: true,
      type: 'select',
      description: 'The category this requirement belongs to',
      validation: 'Required. Must be a configured category.',
      tips: 'Categories are defined in Evaluation Settings'
    },
    priority: {
      name: 'Priority',
      label: 'MoSCoW Priority',
      required: true,
      type: 'select',
      description: 'The importance level of this requirement',
      values: ['Must Have', 'Should Have', 'Could Have', 'Won\'t Have'],
      tips: 'Priority affects weighted scoring calculations'
    },
    acceptance_criteria: {
      name: 'Acceptance Criteria',
      label: 'Acceptance Criteria',
      required: false,
      type: 'textarea',
      description: 'How to determine if requirement is met during scoring',
      validation: 'Maximum 2000 characters.',
      tips: 'Specific criteria help evaluators score consistently'
    },
    weight: {
      name: 'Weight',
      label: 'Weight',
      required: false,
      type: 'number',
      description: 'Relative weight within the category (if using weighted scoring)',
      validation: 'Must be positive. Default is 1.',
      tips: 'Higher weight = more impact on category score',
      default: 1
    },
    status: {
      name: 'Status',
      label: 'Status',
      required: false,
      type: 'readonly',
      description: 'Current status of the requirement',
      values: ['Draft', 'Review', 'Approved', 'Archived'],
      tips: 'Status controls editing and scoring availability'
    },
    source: {
      name: 'Source',
      label: 'Source',
      required: false,
      type: 'text',
      description: 'Where this requirement originated',
      tips: 'Useful for traceability (e.g., "RFP Section 3.2")'
    },
    notes: {
      name: 'Notes',
      label: 'Notes',
      required: false,
      type: 'textarea',
      description: 'Additional notes for evaluators',
      validation: 'Maximum 2000 characters.',
      tips: 'Include scoring guidance or clarifications'
    },
    reference_id: {
      name: 'Reference ID',
      label: 'Ref ID',
      required: false,
      type: 'text',
      description: 'External reference number',
      tips: 'Links to source document requirement IDs'
    }
  },
  
  bestPractices: {
    title: 'Requirements Writing Best Practices',
    guidelines: [
      {
        guideline: 'Be Specific',
        description: 'Avoid vague terms like "user-friendly" or "fast"',
        bad: 'System should be fast',
        good: 'Page load time should be under 3 seconds'
      },
      {
        guideline: 'One Concept Per Requirement',
        description: 'Don\'t combine multiple needs in one requirement',
        bad: 'Support SSO and provide audit logging',
        good: 'Support single sign-on (SSO) authentication' // separate requirement for audit logging
      },
      {
        guideline: 'Make It Testable',
        description: 'Write requirements that can be objectively verified',
        bad: 'Good reporting capabilities',
        good: 'Generate custom reports with filtering by date, user, and status'
      },
      {
        guideline: 'Include Context',
        description: 'Explain why the requirement matters',
        example: 'Support offline mode for field workers who have intermittent connectivity'
      },
      {
        guideline: 'Use Consistent Language',
        description: 'Use same terms throughout - define key terms',
        tip: 'Create a glossary for technical or business terms'
      }
    ],
    recommendedCounts: {
      small: { requirements: '20-40', description: 'Quick vendor comparison' },
      medium: { requirements: '50-80', description: 'Standard evaluation' },
      large: { requirements: '80-150', description: 'Comprehensive evaluation' },
      warning: 'Over 150 requirements may cause evaluator fatigue'
    }
  },
  
  workflow: {
    title: 'Requirements Workflow',
    description: 'Requirements progress through definition to approval before scoring.',
    diagram: `
    ┌─────────┐    Review    ┌──────────┐    Approve    ┌──────────┐
    │  Draft  │ ────────────>│  Review  │ ─────────────>│ Approved │
    └─────────┘              └──────────┘               └──────────┘
         ^                        │                          │
         │        Return          │                     Scoring
         └────────────────────────┘                     Enabled
    `,
    statuses: [
      { name: 'Draft', description: 'Being created or edited. Not visible to evaluators.' },
      { name: 'Review', description: 'Ready for stakeholder review. Edits still allowed.' },
      { name: 'Approved', description: 'Finalized and locked. Available for scoring.' },
      { name: 'Archived', description: 'Removed from active evaluation but preserved.' }
    ]
  },
  
  permissions: {
    evaluation_admin: {
      role: 'Evaluation Admin',
      canView: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canImport: true,
      canAiGenerate: true,
      canApprove: true,
      notes: 'Full control over requirements'
    },
    evaluator: {
      role: 'Evaluator',
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canImport: false,
      canAiGenerate: false,
      canApprove: false,
      notes: 'View requirements for scoring purposes'
    },
    reviewer: {
      role: 'Reviewer',
      canView: true,
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canImport: false,
      canAiGenerate: false,
      canApprove: false,
      notes: 'View requirements and provide feedback'
    },
    observer: {
      role: 'Observer',
      canView: 'Summary only',
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canImport: false,
      canAiGenerate: false,
      canApprove: false,
      notes: 'View requirement counts and categories'
    }
  },
  
  faq: [
    {
      question: 'How many requirements should I have?',
      answer: '50-100 requirements is typical for a comprehensive evaluation. Under 50 may not differentiate vendors well. Over 150 can cause evaluator fatigue and reduce scoring quality.'
    },
    {
      question: 'Can I add requirements after scoring starts?',
      answer: 'Adding requirements after scoring has begun is discouraged as it complicates comparison. If essential, new requirements would need to be scored by all evaluators for all vendors.'
    },
    {
      question: 'How does AI generation work?',
      answer: 'AI analyses your description or uploaded documents to suggest requirements. It uses industry patterns and your context to generate relevant criteria. Always review and refine AI suggestions.'
    },
    {
      question: 'What\'s the difference between weight and priority?',
      answer: 'Priority (MoSCoW) indicates business importance. Weight is a numeric multiplier within a category. Both can affect scoring - MoSCoW in MoSCoW-weighted scoring, weight in category-weighted scoring.'
    },
    {
      question: 'Can vendors see the requirements?',
      answer: 'Vendors see requirements through the Vendor Portal if invited. They can view requirements and provide responses. They cannot see your internal priority weights or other vendors\' responses.'
    },
    {
      question: 'How do I handle compound requirements?',
      answer: 'Split compound requirements into separate items. "Support SSO and LDAP" should be two requirements. This allows more accurate scoring and vendor comparison.'
    },
    {
      question: 'What are acceptance criteria for?',
      answer: 'Acceptance criteria define how to determine if a requirement is met. They help evaluators score consistently by providing clear pass/fail or scoring guidance.'
    },
    {
      question: 'Can I reuse requirements from another evaluation?',
      answer: 'Yes, duplicate an evaluation to copy its requirements, or export requirements from one evaluation and import into another. Review and adjust for the new context.'
    },
    {
      question: 'How do "Won\'t Have" requirements affect scoring?',
      answer: '"Won\'t Have" requirements are not scored (weight = 0). They document scope boundaries and may be considered for future phases. Include them for clarity.'
    },
    {
      question: 'What happens if I delete a requirement with scores?',
      answer: 'Deleting a requirement removes all associated scores. This changes overall vendor rankings. The system warns you before deletion. Consider archiving instead to preserve history.'
    }
  ],
  
  related: ['evaluation-setup', 'vendors', 'scoring', 'workshops', 'evaluator-reports']
};

export default requirementsGuide;
