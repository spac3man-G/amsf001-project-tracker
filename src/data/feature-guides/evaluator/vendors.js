// Vendors Feature Guide
// Complete how-to documentation for vendor management in evaluations

const vendorsGuide = {
  id: 'vendors',
  title: 'Evaluation Vendors',
  category: 'evaluator',
  description: 'Manage vendors participating in your evaluation. Add vendors, invite them to the vendor portal, track their responses, and manage the shortlisting process for software selection.',
  
  navigation: {
    path: '/evaluator/:id/vendors',
    sidebar: 'Evaluator → [Evaluation] → Vendors',
    quickAccess: 'Evaluation Dashboard → Vendors card',
    breadcrumb: 'Home > Evaluator > [Evaluation Name] > Vendors'
  },
  
  howTo: {
    add: {
      title: 'Adding a Vendor to the Evaluation',
      steps: [
        'Navigate to your evaluation\'s Vendors page',
        'Click "Add Vendor" button',
        'Enter the vendor/company name',
        'Enter the product name being evaluated (if different)',
        'Add the primary contact name and email',
        'Add optional secondary contacts',
        'Enter the vendor website URL',
        'Add any initial notes',
        'Click "Save Vendor"'
      ],
      tips: [
        'Use official company names for clarity',
        'Add multiple contacts if different people handle different topics',
        'Include product name when vendor offers multiple products',
        'You can add vendors at any time during setup phase'
      ]
    },
    invite: {
      title: 'Inviting Vendors to the Portal',
      steps: [
        'From the Vendors list, click on a vendor to open details',
        'Click "Invite to Portal" button',
        'Review the invitation email preview',
        'Customize the invitation message if needed',
        'Set the response deadline',
        'Select which requirements to share',
        'Click "Send Invitation"',
        'Vendor receives email with portal access link',
        'Track invitation status in the vendor list'
      ],
      invitationIncludes: [
        'Welcome message and evaluation overview',
        'Portal access credentials',
        'Response deadline',
        'Requirements to respond to',
        'Instructions for using the portal'
      ],
      tips: [
        'Send invitations to all vendors simultaneously for fairness',
        'Give adequate time for responses (2-4 weeks typical)',
        'Ensure contacts have authority to respond officially',
        'Follow up if invitation not accessed within a few days'
      ]
    },
    trackResponse: {
      title: 'Tracking Vendor Responses',
      steps: [
        'View the Vendors list to see response status at a glance',
        'Status shows: Not Invited, Invited, In Progress, Submitted, Declined',
        'Click a vendor to see detailed response progress',
        'View which requirements have responses',
        'See when the vendor last accessed the portal',
        'Check response completion percentage',
        'Set up alerts for approaching deadlines'
      ],
      responseStatuses: [
        { status: 'Not Invited', description: 'Vendor added but not yet invited to portal' },
        { status: 'Invited', description: 'Invitation sent, awaiting portal access' },
        { status: 'Accessed', description: 'Vendor has logged into portal' },
        { status: 'In Progress', description: 'Vendor is working on responses' },
        { status: 'Submitted', description: 'Vendor has submitted complete response' },
        { status: 'Declined', description: 'Vendor has declined to participate' }
      ],
      tips: [
        'Follow up with vendors stuck at "Invited" status',
        'Check response quality, not just completion',
        'Allow Q&A before deadline for clarifications'
      ]
    },
    viewResponses: {
      title: 'Viewing Vendor Responses',
      steps: [
        'Click on a vendor to open their detail page',
        'Go to the "Responses" tab',
        'View responses organised by requirement category',
        'Click a requirement to see the detailed response',
        'View attached documents and evidence',
        'See response history and any updates',
        'Export responses to PDF for offline review'
      ],
      responseTypes: [
        { type: 'Text Response', description: 'Written answer to the requirement' },
        { type: 'Attachment', description: 'Supporting documents (datasheets, screenshots)' },
        { type: 'Compliance Level', description: 'Vendor self-assessment (Full/Partial/No)' },
        { type: 'Notes', description: 'Vendor comments or clarifications' }
      ],
      tips: [
        'Compare responses side-by-side using Compare view',
        'Flag responses needing clarification',
        'Responses inform scoring but don\'t replace demos'
      ]
    },
    shortlist: {
      title: 'Shortlisting Vendors',
      steps: [
        'Review initial vendor scores after first round scoring',
        'Identify top performers and clear non-fits',
        'Go to Vendors page and click "Manage Shortlist"',
        'Select vendors to include in the shortlist',
        'Document shortlist criteria and rationale',
        'Notify vendors of shortlist status (optional)',
        'Shortlisted vendors proceed to detailed evaluation/demos',
        'Non-shortlisted vendors are marked as "Not Progressing"'
      ],
      shortlistCriteria: [
        'Meets all "Must Have" requirements',
        'Scores above minimum threshold (e.g., 60%)',
        'Within budget range',
        'Strategic fit with organisation',
        'Manageable number for detailed evaluation (3-5 typical)'
      ],
      tips: [
        'Document shortlist decisions for transparency',
        'Consider including a "wildcard" vendor',
        'Inform non-shortlisted vendors professionally',
        'Shortlisting is reversible if circumstances change'
      ]
    },
    schedule: {
      title: 'Scheduling Vendor Demos',
      steps: [
        'From a vendor\'s detail page, click "Schedule Demo"',
        'Select the demo type: General, Technical, or Use Case',
        'Set the date and time',
        'Set duration (typically 1-2 hours)',
        'Add attendees from your evaluation team',
        'Add specific topics or scenarios to cover',
        'Send calendar invitation to all parties',
        'Track scheduled demos in the Workshops section'
      ],
      demoTypes: [
        { type: 'General Demo', description: 'High-level product overview and capabilities' },
        { type: 'Technical Demo', description: 'Deep dive into architecture, integration, security' },
        { type: 'Use Case Demo', description: 'Vendor demonstrates specific scenarios' },
        { type: 'Proof of Concept', description: 'Hands-on testing with your data/scenarios' }
      ],
      tips: [
        'Provide demo agenda to vendors in advance',
        'Include key stakeholders from relevant areas',
        'Use standard scenarios across all vendors for fairness',
        'Record sessions for team members who can\'t attend'
      ]
    },
    askQuestions: {
      title: 'Managing Vendor Q&A',
      steps: [
        'From the vendor detail page, go to "Q&A" tab',
        'Click "Ask Question" to send a question to the vendor',
        'Enter your question with context',
        'Set response deadline',
        'Vendor receives notification and can respond in portal',
        'View all Q&A history for the vendor',
        'Mark questions as answered when resolved'
      ],
      tips: [
        'Ask clarifying questions about unclear responses',
        'Send same questions to all vendors for fair comparison',
        'Keep Q&A professional and specific',
        'Questions and answers become part of evaluation record'
      ]
    },
    compare: {
      title: 'Comparing Vendors',
      steps: [
        'From the Vendors list, select vendors to compare',
        'Click "Compare Selected" button',
        'Choose comparison type: Requirements, Scores, Responses',
        'View side-by-side comparison grid',
        'Highlight differences and similarities',
        'Add comparison notes',
        'Export comparison to PDF or Excel'
      ],
      comparisonViews: [
        { view: 'Requirements Matrix', description: 'How each vendor meets each requirement' },
        { view: 'Score Comparison', description: 'Scores by category and overall' },
        { view: 'Response Comparison', description: 'Side-by-side vendor responses' },
        { view: 'Feature Matrix', description: 'Feature availability across vendors' }
      ],
      tips: [
        'Compare no more than 3-4 vendors at once for readability',
        'Use comparison in workshops to facilitate discussion',
        'Focus on differentiating factors, not common features'
      ]
    },
    exclude: {
      title: 'Excluding a Vendor from Evaluation',
      steps: [
        'From the vendor detail page, click "..." menu',
        'Select "Exclude from Evaluation"',
        'Enter the reason for exclusion',
        'Confirm the exclusion',
        'Vendor is marked as excluded and removed from active scoring',
        'Exclusion can be reversed if circumstances change',
        'Historical data is preserved for audit'
      ],
      exclusionReasons: [
        'Does not meet mandatory requirements',
        'Withdrawn from evaluation',
        'Pricing significantly outside budget',
        'Strategic concerns (acquisition, stability)',
        'No response by deadline'
      ],
      tips: [
        'Document exclusion reasons clearly',
        'Notify vendor of exclusion professionally',
        'Excluded vendors remain in records but not in scores'
      ]
    },
    view: {
      title: 'Viewing Vendor Information',
      steps: [
        'Navigate to your evaluation\'s Vendors page',
        'The list shows all vendors with status summary',
        'Use filters: Status, Shortlist, Response status',
        'Click a vendor row to see full details',
        'Vendor detail shows: Profile, Responses, Scores, Q&A, Documents'
      ],
      vendorTabs: [
        { tab: 'Profile', description: 'Basic vendor information and contacts' },
        { tab: 'Responses', description: 'Requirement responses from portal' },
        { tab: 'Scores', description: 'Evaluation scores by category' },
        { tab: 'Q&A', description: 'Questions and answers exchange' },
        { tab: 'Documents', description: 'Uploaded materials and evidence' },
        { tab: 'Activity', description: 'Timeline of all vendor interactions' }
      ],
      tips: [
        'Check vendor activity to gauge engagement',
        'Review all tabs before scoring',
        'Note any concerns in vendor notes'
      ]
    }
  },
  
  fields: {
    vendor_name: {
      name: 'Vendor Name',
      label: 'Company Name',
      required: true,
      type: 'text',
      description: 'The vendor\'s company name',
      validation: 'Required. Maximum 200 characters.',
      tips: 'Use official registered company name'
    },
    product_name: {
      name: 'Product Name',
      label: 'Product',
      required: false,
      type: 'text',
      description: 'The specific product being evaluated',
      validation: 'Maximum 200 characters.',
      tips: 'Important when vendor has multiple products'
    },
    contact_name: {
      name: 'Primary Contact',
      label: 'Contact Name',
      required: true,
      type: 'text',
      description: 'Name of the primary vendor contact',
      validation: 'Required.',
      tips: 'Person responsible for evaluation responses'
    },
    contact_email: {
      name: 'Contact Email',
      label: 'Email',
      required: true,
      type: 'email',
      description: 'Primary contact email address',
      validation: 'Required. Must be valid email.',
      tips: 'Portal invitation will be sent to this address'
    },
    contact_phone: {
      name: 'Contact Phone',
      label: 'Phone',
      required: false,
      type: 'phone',
      description: 'Primary contact phone number',
      tips: 'Useful for scheduling and urgent communications'
    },
    website: {
      name: 'Website',
      label: 'Website',
      required: false,
      type: 'url',
      description: 'Vendor company website URL',
      validation: 'Must be valid URL if provided.',
      tips: 'Helps team research vendor background'
    },
    status: {
      name: 'Status',
      label: 'Status',
      required: false,
      type: 'readonly',
      description: 'Current status in the evaluation process',
      values: ['Active', 'Shortlisted', 'Not Progressing', 'Excluded', 'Selected'],
      tips: 'Status reflects position in evaluation pipeline'
    },
    portal_status: {
      name: 'Portal Status',
      label: 'Portal',
      required: false,
      type: 'readonly',
      description: 'Vendor portal invitation and response status',
      values: ['Not Invited', 'Invited', 'Accessed', 'In Progress', 'Submitted', 'Declined'],
      tips: 'Tracks vendor engagement with portal'
    },
    response_deadline: {
      name: 'Response Deadline',
      label: 'Deadline',
      required: false,
      type: 'date',
      description: 'Deadline for vendor to submit portal responses',
      tips: 'Set when sending portal invitation'
    },
    notes: {
      name: 'Notes',
      label: 'Notes',
      required: false,
      type: 'textarea',
      description: 'Internal notes about this vendor',
      validation: 'Maximum 5000 characters.',
      tips: 'Record impressions, concerns, or context'
    },
    tags: {
      name: 'Tags',
      label: 'Tags',
      required: false,
      type: 'tags',
      description: 'Labels for categorizing or filtering vendors',
      tips: 'Examples: "Enterprise", "Startup", "UK-based"'
    }
  },
  
  vendorPortal: {
    title: 'Vendor Portal',
    description: 'The Vendor Portal is a secure space where invited vendors can view requirements and submit responses.',
    features: [
      {
        feature: 'Requirement Viewing',
        description: 'Vendors see requirements organized by category with descriptions and acceptance criteria'
      },
      {
        feature: 'Response Submission',
        description: 'Structured responses with text, compliance levels, and file attachments'
      },
      {
        feature: 'Document Upload',
        description: 'Vendors can attach supporting documents, datasheets, and evidence'
      },
      {
        feature: 'Progress Tracking',
        description: 'Vendors see their completion status and remaining requirements'
      },
      {
        feature: 'Q&A Communication',
        description: 'Two-way communication for clarifications and questions'
      },
      {
        feature: 'Submission Confirmation',
        description: 'Clear submission process with confirmation'
      }
    ],
    vendorView: [
      'Evaluation overview and deadlines',
      'Requirements list with descriptions',
      'Response entry forms',
      'Document upload interface',
      'Completion progress indicator',
      'Questions from evaluation team',
      'Final submission button'
    ],
    vendorCannotSee: [
      'Other vendors in the evaluation',
      'Your internal notes or scores',
      'Requirement weights or priorities (unless shared)',
      'Other vendors\' responses',
      'Evaluation team identities'
    ]
  },
  
  workflow: {
    title: 'Vendor Evaluation Pipeline',
    description: 'Vendors progress through the evaluation pipeline from addition to final selection.',
    diagram: `
    ┌───────┐    ┌─────────┐    ┌────────────┐    ┌─────────────┐    ┌──────────┐
    │ Added │ -> │ Invited │ -> │ Responding │ -> │ Shortlisted │ -> │ Selected │
    └───────┘    └─────────┘    └────────────┘    └─────────────┘    └──────────┘
                      │               │                  │
                      v               v                  v
                 ┌──────────┐   ┌──────────┐      ┌────────────────┐
                 │ Declined │   │ Excluded │      │ Not Progressing│
                 └──────────┘   └──────────┘      └────────────────┘
    `,
    stages: [
      { stage: 'Added', description: 'Vendor added to evaluation, not yet engaged' },
      { stage: 'Invited', description: 'Portal invitation sent, awaiting response' },
      { stage: 'Responding', description: 'Vendor actively working on responses' },
      { stage: 'Submitted', description: 'Vendor has submitted complete response' },
      { stage: 'Shortlisted', description: 'Selected for detailed evaluation/demos' },
      { stage: 'Selected', description: 'Chosen as the winning vendor' },
      { stage: 'Not Progressing', description: 'Did not make shortlist' },
      { stage: 'Excluded', description: 'Removed from evaluation for cause' },
      { stage: 'Declined', description: 'Vendor chose not to participate' }
    ]
  },
  
  permissions: {
    evaluation_admin: {
      role: 'Evaluation Admin',
      canView: true,
      canAdd: true,
      canEdit: true,
      canDelete: true,
      canInvite: true,
      canShortlist: true,
      canViewResponses: true,
      notes: 'Full control over vendor management'
    },
    evaluator: {
      role: 'Evaluator',
      canView: true,
      canAdd: false,
      canEdit: false,
      canDelete: false,
      canInvite: false,
      canShortlist: false,
      canViewResponses: true,
      notes: 'View vendors and responses for scoring'
    },
    reviewer: {
      role: 'Reviewer',
      canView: true,
      canAdd: false,
      canEdit: false,
      canDelete: false,
      canInvite: false,
      canShortlist: false,
      canViewResponses: true,
      notes: 'View vendors and responses for review'
    },
    observer: {
      role: 'Observer',
      canView: 'Names and status only',
      canAdd: false,
      canEdit: false,
      canDelete: false,
      canInvite: false,
      canShortlist: false,
      canViewResponses: false,
      notes: 'See vendor list summary only'
    }
  },
  
  faq: [
    {
      question: 'How do I invite multiple vendors at once?',
      answer: 'Use the bulk action feature. Select multiple vendors using checkboxes, then click "Bulk Actions" → "Send Invitations". All selected vendors receive the same invitation with the same deadline.'
    },
    {
      question: 'Can vendors see each other?',
      answer: 'No, the portal is completely isolated. Each vendor only sees their own access, requirements to respond to, and their own responses. They cannot see other participating vendors.'
    },
    {
      question: 'What if a vendor misses the deadline?',
      answer: 'You can extend the deadline for individual vendors if needed. Go to vendor details and edit the response deadline. Consider fairness to other vendors when extending.'
    },
    {
      question: 'How do I handle vendor questions about requirements?',
      answer: 'Vendors can submit questions through the portal. You receive notifications and can respond through the Q&A section. Consider sharing relevant Q&A with all vendors for fairness.'
    },
    {
      question: 'Can vendors update their responses after submission?',
      answer: 'By default, submitted responses are locked. You can allow revisions by clicking "Allow Revision" on the vendor detail page. Set a new deadline for the revision.'
    },
    {
      question: 'How many vendors should I include?',
      answer: 'Start with 5-8 vendors for initial evaluation. Shortlist to 3-4 for detailed evaluation and demos. Too few limits choice; too many is resource-intensive.'
    },
    {
      question: 'What information should I collect from vendors?',
      answer: 'At minimum: company name, product name, primary contact with email. Additional useful data: website, company size, years in business, reference customers.'
    },
    {
      question: 'Can I add a vendor mid-evaluation?',
      answer: 'Yes, but consider fairness. Late additions may not have time to provide complete responses. They\'ll need to be scored against the same criteria as other vendors.'
    },
    {
      question: 'How do I exclude a vendor fairly?',
      answer: 'Document clear criteria for exclusion (e.g., doesn\'t meet mandatory requirements). Apply criteria consistently across all vendors. Notify excluded vendors professionally.'
    },
    {
      question: 'Do vendors receive automatic notifications?',
      answer: 'Yes, vendors receive emails for: invitation, deadline reminders (7 days, 1 day), questions from your team, and confirmation of submission. Configure notifications in settings.'
    }
  ],
  
  related: ['evaluation-setup', 'requirements', 'scoring', 'workshops', 'evaluator-reports']
};

export default vendorsGuide;
