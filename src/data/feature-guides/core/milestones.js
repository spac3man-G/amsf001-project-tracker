// Milestone Feature Guide
// Complete how-to documentation for milestone functionality

const milestonesGuide = {
  id: 'milestones',
  title: 'Milestones',
  category: 'core',
  description: 'Milestones represent key payment points and project phases. They track budget allocation, billable amounts, actual spend, and require customer sign-off via certificates before payment can be released. Milestones contain deliverables which break down the work to be completed.',
  
  navigation: {
    path: '/milestones',
    sidebar: 'Project → Milestones',
    quickAccess: 'Dashboard → Milestone Progress widget',
    breadcrumb: 'Home > Project > Milestones'
  },
  
  howTo: {
    create: {
      title: 'Creating a Milestone',
      steps: [
        'Navigate to the Milestones page from the sidebar (Project → Milestones)',
        'Click the "New Milestone" button in the top right corner',
        'Enter a name that clearly describes the phase or payment point',
        'Set the planned start and end dates',
        'Enter the budget amount (total allocated to this milestone)',
        'Enter the billable amount (what will be invoiced to customer)',
        'Add a description of what this milestone covers',
        'Click "Save" to create the milestone'
      ],
      tips: [
        'Milestone names should be meaningful (e.g., "Phase 1: Discovery" not "M1")',
        'Budget is your internal allocation; billable is what the customer pays',
        'Dates should align with your project schedule',
        'You can add deliverables to the milestone after creation',
        'Consider the payment schedule when setting milestone boundaries'
      ],
      videoUrl: null
    },
    edit: {
      title: 'Editing a Milestone',
      steps: [
        'Navigate to the Milestones page',
        'Find the milestone you want to edit',
        'Click the edit icon (pencil) or click the row to open details',
        'Modify the name, dates, budget, billable amount, or description',
        'Click "Save" to apply changes'
      ],
      tips: [
        'Changes to budget/billable may require a variation if the project is baselined',
        'Completed milestones can still be edited by PMs and Admins',
        'Date changes may affect dependent deliverables'
      ]
    },
    updateStatus: {
      title: 'Updating Milestone Status',
      steps: [
        'Navigate to the Milestones page or open milestone details',
        'Find the Status field or status indicator',
        'Click to change the status',
        'Select the new status: Not Started, In Progress, or Completed',
        'Confirm the status change'
      ],
      tips: [
        'Status should reflect actual progress, not planned dates',
        'Moving to "Completed" does not automatically trigger certificate request',
        'The system may show "At Risk" status automatically if dates are slipping',
        'Status changes are logged in the audit trail'
      ]
    },
    manageBudget: {
      title: 'Managing Milestone Budget',
      steps: [
        'Open the milestone details page',
        'Review the budget summary showing Budget, Billable, and Actual',
        'The "Actual" figure is calculated from approved timesheets and expenses',
        'Compare Actual to Budget to monitor spend',
        'Use the variance indicator to identify over/under spend',
        'If budget needs adjustment, edit the milestone or create a variation'
      ],
      tips: [
        'Budget = your internal cost allocation',
        'Billable = what you invoice the customer',
        'Actual = sum of approved timesheets (hours × rates) + approved expenses',
        'Variance = Budget - Actual (negative means overspend)',
        'Monitor regularly to catch budget issues early'
      ]
    },
    certificate: {
      title: 'Requesting Milestone Certificate Sign-off',
      steps: [
        'Ensure all deliverables in the milestone are complete',
        'Navigate to the milestone details page',
        'Click "Request Certificate" button',
        'Add any notes for the customer (optional)',
        'Confirm the request',
        'The Customer PM will receive a notification to sign off',
        'Monitor the certificate status in the milestone view'
      ],
      tips: [
        'All deliverables should be in "Delivered" status before requesting',
        'The customer may request changes before signing',
        'Signed certificates are required for milestone payment',
        'You can cancel a certificate request if needed',
        'Keep notes brief - details should be in the deliverables'
      ]
    },
    signCertificate: {
      title: 'Signing a Milestone Certificate (Customer PM only)',
      steps: [
        'You will receive a notification when a certificate is requested',
        'Navigate to the milestone details page',
        'Review the completed deliverables and work summary',
        'Review any notes from the supplier',
        'Click "Sign Certificate" to approve, or "Request Changes" to reject',
        'If signing, confirm your digital signature',
        'The milestone will be marked as certified'
      ],
      tips: [
        'Only Customer PMs can sign certificates',
        'Review deliverables carefully before signing',
        'Signing authorises payment for the milestone',
        'You can add comments when requesting changes',
        'Signed certificates cannot be revoked'
      ]
    },
    view: {
      title: 'Viewing Milestones',
      steps: [
        'Navigate to the Milestones page from the sidebar',
        'View the milestone list with key information: name, dates, status, budget',
        'Use filters to show specific statuses or date ranges',
        'Click on any milestone to see full details',
        'View the deliverables tab to see work items within the milestone',
        'View the finance tab to see budget breakdown and actuals'
      ],
      tips: [
        'The progress bar shows deliverable completion percentage',
        'RAG indicators show milestone health at a glance',
        'Click column headers to sort the list',
        'Export to CSV for reporting'
      ]
    },
    addDeliverable: {
      title: 'Adding Deliverables to a Milestone',
      steps: [
        'Open the milestone details page',
        'Click the "Deliverables" tab',
        'Click "Add Deliverable" button',
        'Enter the deliverable name and details',
        'Set planned dates within the milestone date range',
        'Click "Save" to add the deliverable'
      ],
      tips: [
        'Deliverables break down the milestone into trackable work items',
        'Each deliverable can have its own tasks',
        'Deliverable dates must fall within milestone dates',
        'You can also create deliverables from the Deliverables page'
      ]
    }
  },
  
  fields: {
    name: {
      name: 'Name',
      label: 'Milestone Name',
      required: true,
      type: 'text',
      description: 'A descriptive name for the milestone',
      validation: 'Required. Maximum 200 characters.',
      tips: 'Use meaningful names like "Phase 1: Discovery" rather than "M1".'
    },
    description: {
      name: 'Description',
      label: 'Description',
      required: false,
      type: 'textarea',
      description: 'Detailed description of what this milestone covers',
      validation: 'Maximum 2000 characters',
      tips: 'Describe the scope, objectives, and key outputs of this phase.'
    },
    start_date: {
      name: 'Start Date',
      label: 'Planned Start Date',
      required: true,
      type: 'date',
      description: 'When work on this milestone is planned to begin',
      validation: 'Must be within project date range. Must be before end date.',
      tips: 'Align with your project schedule and resource availability.',
      format: 'DD/MM/YYYY'
    },
    end_date: {
      name: 'End Date',
      label: 'Planned End Date',
      required: true,
      type: 'date',
      description: 'When this milestone is planned to be completed',
      validation: 'Must be within project date range. Must be after start date.',
      tips: 'Include buffer for review and sign-off activities.',
      format: 'DD/MM/YYYY'
    },
    budget: {
      name: 'Budget',
      label: 'Budget',
      required: true,
      type: 'currency',
      description: 'The internal budget allocated to deliver this milestone',
      validation: 'Must be greater than 0',
      tips: 'This is your cost to deliver, including labour and expenses. Used for internal tracking and margin calculations.'
    },
    billable: {
      name: 'Billable',
      label: 'Billable Amount',
      required: true,
      type: 'currency',
      description: 'The amount that will be invoiced to the customer for this milestone',
      validation: 'Must be greater than 0',
      tips: 'This is what the customer pays. The difference between billable and budget is your margin.'
    },
    actual: {
      name: 'Actual',
      label: 'Actual Spend',
      required: false,
      type: 'currency',
      description: 'The calculated actual spend based on approved timesheets and expenses',
      tips: 'Automatically calculated. Cannot be edited directly. Updates as timesheets and expenses are approved.'
    },
    status: {
      name: 'Status',
      label: 'Status',
      required: true,
      type: 'select',
      description: 'Current progress status of the milestone',
      values: ['Not Started', 'In Progress', 'Completed', 'At Risk', 'On Hold'],
      tips: 'Update status to reflect actual progress. "At Risk" may be set automatically if dates are slipping.'
    },
    certificate_status: {
      name: 'Certificate Status',
      label: 'Certificate Status',
      required: false,
      type: 'readonly',
      description: 'Status of the milestone sign-off certificate',
      values: ['Not Requested', 'Requested', 'Changes Requested', 'Signed'],
      tips: 'Managed through the certificate workflow. Signed status required for payment.'
    },
    progress: {
      name: 'Progress',
      label: 'Progress',
      required: false,
      type: 'percentage',
      description: 'Percentage of deliverables completed',
      tips: 'Automatically calculated based on deliverable status. Shows completion progress.'
    }
  },
  
  workflow: {
    title: 'Milestone Status Workflow',
    description: 'Milestones progress through status stages as work is completed. A separate certificate workflow handles customer sign-off.',
    diagram: `
    ┌─────────────┐    Start Work    ┌─────────────┐    Complete    ┌───────────┐
    │ Not Started │ ────────────────>│ In Progress │ ──────────────>│ Completed │
    └─────────────┘                  └─────────────┘                └───────────┘
                                           │
                                           │ Issues
                                           ▼
                                     ┌──────────┐
                                     │ At Risk  │
                                     └──────────┘
    `,
    statuses: [
      { 
        name: 'Not Started', 
        description: 'Milestone work has not yet begun',
        colour: 'grey'
      },
      { 
        name: 'In Progress', 
        description: 'Work is actively being performed on this milestone',
        colour: 'blue'
      },
      { 
        name: 'Completed', 
        description: 'All deliverables are complete, ready for certificate',
        colour: 'green'
      },
      { 
        name: 'At Risk', 
        description: 'Milestone is in danger of missing dates or budget',
        colour: 'red'
      },
      { 
        name: 'On Hold', 
        description: 'Work has been paused pending resolution of blockers',
        colour: 'amber'
      }
    ],
    transitions: [
      { 
        from: 'Not Started', 
        to: 'In Progress', 
        action: 'Start Work', 
        actor: 'PM or Admin',
        description: 'Begin work on the milestone'
      },
      { 
        from: 'In Progress', 
        to: 'Completed', 
        action: 'Complete', 
        actor: 'PM or Admin',
        description: 'Mark milestone as complete when all deliverables done'
      },
      { 
        from: 'In Progress', 
        to: 'At Risk', 
        action: 'Flag Risk', 
        actor: 'System or PM',
        description: 'Automatic when dates slip, or manual flagging'
      },
      { 
        from: 'At Risk', 
        to: 'In Progress', 
        action: 'Resolve Risk', 
        actor: 'PM or Admin',
        description: 'Return to normal progress after addressing issues'
      },
      { 
        from: 'In Progress', 
        to: 'On Hold', 
        action: 'Pause', 
        actor: 'PM or Admin',
        description: 'Temporarily pause work'
      },
      { 
        from: 'On Hold', 
        to: 'In Progress', 
        action: 'Resume', 
        actor: 'PM or Admin',
        description: 'Resume work after hold is lifted'
      }
    ]
  },
  
  certificateWorkflow: {
    title: 'Milestone Certificate Workflow',
    description: 'Certificates provide formal customer sign-off on milestone completion, authorising payment.',
    diagram: `
    ┌───────────────┐   Request   ┌───────────┐    Sign    ┌────────┐
    │ Not Requested │ ───────────>│ Requested │ ──────────>│ Signed │
    └───────────────┘             └───────────┘            └────────┘
                                       │
                                       │ Request Changes
                                       ▼
                                ┌──────────────────┐
                                │ Changes Requested │──> (Back to Not Requested after fixes)
                                └──────────────────┘
    `,
    statuses: [
      { 
        name: 'Not Requested', 
        description: 'Certificate has not been requested yet',
        colour: 'grey'
      },
      { 
        name: 'Requested', 
        description: 'Certificate requested, awaiting customer sign-off',
        colour: 'blue'
      },
      { 
        name: 'Changes Requested', 
        description: 'Customer has requested changes before signing',
        colour: 'amber'
      },
      { 
        name: 'Signed', 
        description: 'Customer has signed off, payment authorised',
        colour: 'green'
      }
    ],
    transitions: [
      { 
        from: 'Not Requested', 
        to: 'Requested', 
        action: 'Request Certificate', 
        actor: 'Supplier PM or Admin',
        description: 'Request customer to review and sign'
      },
      { 
        from: 'Requested', 
        to: 'Signed', 
        action: 'Sign', 
        actor: 'Customer PM',
        description: 'Customer approves and signs certificate'
      },
      { 
        from: 'Requested', 
        to: 'Changes Requested', 
        action: 'Request Changes', 
        actor: 'Customer PM',
        description: 'Customer requests modifications'
      },
      { 
        from: 'Changes Requested', 
        to: 'Not Requested', 
        action: 'Address Changes', 
        actor: 'Supplier PM',
        description: 'After fixes, must re-request certificate'
      }
    ]
  },
  
  permissions: {
    contributor: {
      role: 'Contributor',
      canView: 'All milestones in project (read-only)',
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canUpdateStatus: false,
      canRequestCertificate: false,
      canSignCertificate: false,
      notes: 'Contributors can view milestones but cannot modify them'
    },
    supplier_pm: {
      role: 'Supplier PM',
      canView: 'All milestones in project',
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canUpdateStatus: true,
      canRequestCertificate: true,
      canSignCertificate: false,
      notes: 'Supplier PMs manage milestones and request certificates'
    },
    customer_pm: {
      role: 'Customer PM',
      canView: 'All milestones in project',
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canUpdateStatus: false,
      canRequestCertificate: false,
      canSignCertificate: true,
      notes: 'Customer PMs review and sign milestone certificates'
    },
    admin: {
      role: 'Admin',
      canView: 'All milestones in project',
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canUpdateStatus: true,
      canRequestCertificate: true,
      canSignCertificate: true,
      notes: 'Admins have full access to all milestone operations'
    },
    partner_admin: {
      role: 'Partner Admin',
      canView: 'All milestones in project (read-only)',
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canUpdateStatus: false,
      canRequestCertificate: false,
      canSignCertificate: false,
      notes: 'Partner Admins can view milestones for context but cannot modify'
    },
    partner_user: {
      role: 'Partner User',
      canView: 'All milestones in project (read-only)',
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canUpdateStatus: false,
      canRequestCertificate: false,
      canSignCertificate: false,
      notes: 'Partner Users can view milestones for context'
    }
  },
  
  faq: [
    {
      question: 'What is the difference between Budget and Billable?',
      answer: 'Budget is your internal cost to deliver the milestone (labour + expenses). Billable is what you invoice the customer. The difference is your margin. For example, if Budget is £80,000 and Billable is £100,000, your margin is £20,000 (20%).'
    },
    {
      question: 'What is a milestone certificate?',
      answer: 'A certificate is formal customer sign-off confirming the milestone is complete and payment can be released. The Customer PM reviews the completed deliverables and signs digitally. This is typically required before invoicing.'
    },
    {
      question: 'How is "Actual" spend calculated?',
      answer: 'Actual spend is automatically calculated from approved timesheets (hours worked × resource day rates) plus approved expenses marked against deliverables in this milestone. It updates as items are approved.'
    },
    {
      question: 'What does "At Risk" status mean?',
      answer: 'At Risk indicates the milestone may miss its deadline or exceed budget. The system can flag this automatically when dates slip or spend exceeds thresholds. PMs can also manually flag risks. It\'s a warning to take action.'
    },
    {
      question: 'Can I change a milestone after work has started?',
      answer: 'Yes, PMs and Admins can edit milestones at any time. However, if the project is baselined, significant changes to budget or dates should be captured through a formal variation to maintain audit trail.'
    },
    {
      question: 'How do I add work items to a milestone?',
      answer: 'Add deliverables to a milestone from the milestone details page (Deliverables tab) or from the Deliverables page. Each deliverable can then have tasks added to it for more granular tracking.'
    },
    {
      question: 'What happens when a certificate is signed?',
      answer: 'When the Customer PM signs a certificate, it authorises payment for the milestone. The milestone is marked as certified, and the billing amount can be invoiced. Signed certificates cannot be revoked.'
    },
    {
      question: 'Why can\'t I request a certificate?',
      answer: 'You need Supplier PM or Admin role to request certificates. Also check that all deliverables are complete - you should ensure deliverables are in "Delivered" status before requesting sign-off.'
    },
    {
      question: 'How do I track milestone progress?',
      answer: 'Progress is shown as a percentage based on deliverable completion. View the progress bar on the milestone list or details page. The Dashboard also shows overall milestone progress widgets.'
    },
    {
      question: 'Can I delete a milestone?',
      answer: 'PMs and Admins can delete milestones that have no approved timesheets or expenses. If financial data exists, the milestone cannot be deleted - consider marking it as cancelled or creating a variation instead.'
    },
    {
      question: 'What is the relationship between milestones and billing?',
      answer: 'Milestones are the primary billing unit. Each milestone has a billable amount that becomes payable when the certificate is signed. The Finance page shows billing status by milestone.'
    },
    {
      question: 'How do I handle a customer requesting changes to a certificate?',
      answer: 'When a customer requests changes, address their feedback, update deliverables as needed, then re-request the certificate. The certificate status will return to "Not Requested" after changes are addressed.'
    }
  ],
  
  related: ['deliverables', 'billing', 'variations', 'timesheets', 'expenses', 'workflows']
};

export default milestonesGuide;
