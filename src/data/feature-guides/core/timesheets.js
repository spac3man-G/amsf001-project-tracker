// Timesheet Feature Guide
// Complete how-to documentation for timesheet functionality

const timesheetsGuide = {
  id: 'timesheets',
  title: 'Timesheets',
  category: 'core',
  description: 'Record and submit time worked on project tasks and deliverables. Timesheets track hours spent by team members and flow through a validation and approval workflow before being included in billing.',
  
  navigation: {
    path: '/timesheets',
    sidebar: 'Time & Expenses → Timesheets',
    quickAccess: 'Dashboard → My Draft Timesheets widget',
    breadcrumb: 'Home > Time & Expenses > Timesheets'
  },
  
  howTo: {
    create: {
      title: 'Creating a Timesheet Entry',
      steps: [
        'Navigate to the Timesheets page from the sidebar (Time & Expenses → Timesheets)',
        'Click the "New Entry" button in the top right corner',
        'Select the date the work was performed using the date picker',
        'Choose the deliverable or task you worked on from the dropdown',
        'Enter the number of hours worked (e.g., 7.5 for 7 hours 30 minutes)',
        'Add any notes or description of the work performed (optional but recommended)',
        'Click "Save as Draft" to save for later editing, or "Submit" to send for validation immediately'
      ],
      tips: [
        'You can use the weekly view to enter multiple days at once - click "Weekly View" toggle',
        'Draft entries can be edited until submitted',
        'Use the calendar picker to quickly navigate to past dates',
        'The deliverable dropdown shows only active deliverables in the current project',
        'Notes help validators understand what work was performed'
      ],
      videoUrl: null
    },
    edit: {
      title: 'Editing a Timesheet Entry',
      steps: [
        'Navigate to the Timesheets page',
        'Find the entry you want to edit in the list',
        'Click the edit icon (pencil) on the row, or click the row to open details',
        'Make your changes to date, hours, deliverable, or notes',
        'Click "Save" to save changes'
      ],
      tips: [
        'Only entries in "Draft" status can be edited',
        'If an entry has been submitted, you must ask a PM to reject it first',
        'The rejection will return the entry to Draft status with notes explaining why'
      ]
    },
    submit: {
      title: 'Submitting Timesheets for Validation',
      steps: [
        'Navigate to the Timesheets page',
        'Review your draft entries to ensure accuracy',
        'Select the entries you want to submit using the checkboxes',
        'Or use "Select All Drafts" to select all draft entries',
        'Click the "Submit Selected" button',
        'Confirm the submission in the confirmation dialog',
        'Entries will change to "Submitted" status'
      ],
      tips: [
        'Once submitted, entries cannot be edited by you',
        'You will receive a notification when entries are validated or rejected',
        'Submit regularly (weekly recommended) to ensure timely validation and billing',
        'Bulk submission saves time - select multiple entries at once'
      ]
    },
    view: {
      title: 'Viewing Timesheets',
      steps: [
        'Navigate to the Timesheets page',
        'Use the status filter to show specific statuses (Draft, Submitted, Validated, etc.)',
        'Use the date range filter to narrow down to a specific period',
        'Use the resource filter (if PM/Admin) to view specific team members',
        'Click on any row to see full details including validation history',
        'Use the summary cards at the top for quick totals by status'
      ],
      tips: [
        'The default view shows your own entries only',
        'PMs and Admins can see all team entries using the resource filter',
        'Export to CSV using the export button for reporting',
        'Summary cards update based on current filters'
      ]
    },
    validate: {
      title: 'Validating Timesheets (Supplier PM/Admin only)',
      steps: [
        'Navigate to the Timesheets page',
        'Filter by status "Submitted" to see entries awaiting validation',
        'Review each entry - check hours, deliverable assignment, and notes',
        'Select entries to validate using checkboxes',
        'Click "Validate Selected" to approve them',
        'Or click "Reject" on individual entries with rejection notes',
        'Validated entries will move to "Validated" status'
      ],
      tips: [
        'Only Supplier PM and Admin roles can validate timesheets',
        'Validated timesheets then go to Customer PM for approval',
        'Always add rejection notes to help the submitter understand what to fix',
        'You can validate in bulk to save time'
      ]
    },
    approve: {
      title: 'Approving Timesheets (Customer PM only)',
      steps: [
        'Navigate to the Timesheets page',
        'Filter by status "Validated" to see entries awaiting approval',
        'Review the validated entries',
        'Select entries to approve using checkboxes',
        'Click "Approve Selected" to give final approval',
        'Approved entries will move to "Approved" status and be included in billing'
      ],
      tips: [
        'Only Customer PM role can give final approval',
        'Approved timesheets are included in milestone billing calculations',
        'You can reject back to the supplier team if issues are found'
      ]
    }
  },
  
  fields: {
    date: {
      name: 'Date',
      label: 'Date',
      required: true,
      type: 'date',
      description: 'The date the work was performed',
      validation: 'Must be within the project date range and not in the future',
      tips: 'Use the calendar picker for easy selection. Cannot log time for future dates.',
      format: 'DD/MM/YYYY'
    },
    deliverable_id: {
      name: 'Deliverable',
      label: 'Deliverable / Task',
      required: true,
      type: 'select',
      description: 'The deliverable or task the time was spent on',
      validation: 'Must be an active deliverable in the current project',
      tips: 'Start typing to search deliverables by name. Only active deliverables are shown.'
    },
    hours_worked: {
      name: 'Hours Worked',
      label: 'Hours',
      required: true,
      type: 'number',
      description: 'Number of hours worked on this date',
      validation: 'Must be between 0.25 and 24 hours. Decimal values allowed.',
      tips: 'Use decimals: 0.5 = 30 minutes, 7.5 = 7 hours 30 minutes. Minimum 15 minutes (0.25).',
      min: 0.25,
      max: 24,
      step: 0.25
    },
    notes: {
      name: 'Notes',
      label: 'Notes / Description',
      required: false,
      type: 'textarea',
      description: 'Additional details about the work performed',
      validation: 'Maximum 500 characters',
      tips: 'Helpful for validation and future reference. Describe what you worked on.'
    },
    status: {
      name: 'Status',
      label: 'Status',
      required: false,
      type: 'readonly',
      description: 'Current validation status of the entry',
      values: ['Draft', 'Submitted', 'Validated', 'Approved', 'Rejected'],
      tips: 'Status is managed by the workflow, not edited directly. Changes automatically as entry progresses through validation.'
    },
    resource_id: {
      name: 'Resource',
      label: 'Resource',
      required: true,
      type: 'auto',
      description: 'The team member this timesheet is for',
      tips: 'Automatically set to your linked resource. PMs can create entries for other team members.'
    }
  },
  
  workflow: {
    title: 'Timesheet Approval Workflow',
    description: 'Timesheets follow a validation and approval process before being finalised and included in billing.',
    diagram: `
    ┌─────────┐     Submit      ┌───────────┐    Validate    ┌───────────┐    Approve    ┌──────────┐
    │  Draft  │ ───────────────>│ Submitted │ ──────────────>│ Validated │ ─────────────>│ Approved │
    └─────────┘                 └───────────┘                └───────────┘               └──────────┘
         ^                           │                             │
         │         Reject            │           Reject            │
         └───────────────────────────┴─────────────────────────────┘
    `,
    statuses: [
      { 
        name: 'Draft', 
        description: 'Entry created but not yet submitted. Can be edited or deleted.',
        colour: 'grey'
      },
      { 
        name: 'Submitted', 
        description: 'Entry submitted for validation. Awaiting Supplier PM review.',
        colour: 'blue'
      },
      { 
        name: 'Validated', 
        description: 'Entry validated by Supplier PM. Awaiting Customer PM approval.',
        colour: 'amber'
      },
      { 
        name: 'Approved', 
        description: 'Entry approved by Customer PM. Included in billing.',
        colour: 'green'
      },
      { 
        name: 'Rejected', 
        description: 'Entry rejected and returned to draft status with notes.',
        colour: 'red'
      }
    ],
    transitions: [
      { 
        from: 'Draft', 
        to: 'Submitted', 
        action: 'Submit', 
        actor: 'Creator (any role)',
        description: 'User submits their timesheet for validation'
      },
      { 
        from: 'Submitted', 
        to: 'Validated', 
        action: 'Validate', 
        actor: 'Supplier PM or Admin',
        description: 'Supplier PM confirms entry is accurate'
      },
      { 
        from: 'Submitted', 
        to: 'Rejected', 
        action: 'Reject', 
        actor: 'Supplier PM or Admin',
        description: 'Supplier PM returns entry with rejection notes'
      },
      { 
        from: 'Validated', 
        to: 'Approved', 
        action: 'Approve', 
        actor: 'Customer PM',
        description: 'Customer PM gives final approval for billing'
      },
      { 
        from: 'Validated', 
        to: 'Rejected', 
        action: 'Reject', 
        actor: 'Customer PM',
        description: 'Customer PM returns entry with rejection notes'
      },
      { 
        from: 'Rejected', 
        to: 'Draft', 
        action: 'Auto-revert', 
        actor: 'System',
        description: 'Rejected entries automatically return to draft status'
      }
    ]
  },
  
  permissions: {
    contributor: {
      role: 'Contributor',
      canView: 'Own entries only',
      canCreate: true,
      canEdit: 'Own draft entries only',
      canDelete: 'Own draft entries only',
      canSubmit: true,
      canValidate: false,
      canApprove: false,
      notes: 'Contributors can only see and manage their own timesheet entries'
    },
    supplier_pm: {
      role: 'Supplier PM',
      canView: 'All entries in project',
      canCreate: true,
      canEdit: 'All draft entries',
      canDelete: 'All draft entries',
      canSubmit: true,
      canValidate: true,
      canApprove: false,
      notes: 'Supplier PMs validate timesheets before customer approval'
    },
    customer_pm: {
      role: 'Customer PM',
      canView: 'All entries in project',
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canSubmit: false,
      canValidate: false,
      canApprove: true,
      notes: 'Customer PMs give final approval for billing'
    },
    admin: {
      role: 'Admin',
      canView: 'All entries in project',
      canCreate: true,
      canEdit: 'All draft entries',
      canDelete: 'All draft entries',
      canSubmit: true,
      canValidate: true,
      canApprove: true,
      notes: 'Admins have full access to all timesheet operations'
    },
    partner_admin: {
      role: 'Partner Admin',
      canView: 'Partner team entries only',
      canCreate: true,
      canEdit: 'Partner team draft entries',
      canDelete: 'Partner team draft entries',
      canSubmit: true,
      canValidate: false,
      canApprove: false,
      notes: 'Partner Admins manage timesheets for their partner team'
    },
    partner_user: {
      role: 'Partner User',
      canView: 'Own entries only',
      canCreate: true,
      canEdit: 'Own draft entries only',
      canDelete: 'Own draft entries only',
      canSubmit: true,
      canValidate: false,
      canApprove: false,
      notes: 'Partner Users can only manage their own entries'
    }
  },
  
  faq: [
    {
      question: 'Can I edit a submitted timesheet?',
      answer: 'No, once submitted, entries cannot be edited. Ask a Supplier PM or Admin to reject it back to Draft status, then you can make changes and resubmit.'
    },
    {
      question: 'What happens if my timesheet is rejected?',
      answer: 'The entry returns to Draft status automatically. You will see rejection notes explaining why it was rejected. Review the notes, make corrections, and resubmit.'
    },
    {
      question: 'Can I submit timesheets for future dates?',
      answer: 'No, you can only record time for dates up to and including today. Future dates are not allowed.'
    },
    {
      question: 'How do I see timesheets for my whole team?',
      answer: 'If you have PM or Admin role, use the Resource filter on the Timesheets page to view entries by team member. Contributors can only see their own entries.'
    },
    {
      question: 'What is the difference between Validated and Approved?',
      answer: 'Validated means the Supplier PM has confirmed the entry is accurate. Approved means the Customer PM has signed off on it for billing purposes. Both steps are required.'
    },
    {
      question: 'Can I bulk submit multiple timesheet entries?',
      answer: 'Yes, use the checkboxes to select multiple Draft entries, then click "Submit Selected" to submit them all at once.'
    },
    {
      question: 'What is the minimum time I can log?',
      answer: '15 minutes (0.25 hours). Entries must be at least 15 minutes and use 15-minute increments.'
    },
    {
      question: 'How do I view my timesheet history?',
      answer: 'Use the date range filter to select past periods, or remove the filter to see all entries. You can also export to CSV for historical analysis.'
    },
    {
      question: 'Why can\'t I see certain deliverables in the dropdown?',
      answer: 'The dropdown only shows active deliverables in the current project. If a deliverable is completed or cancelled, it won\'t appear. Contact your PM if you need to log time against a completed deliverable.'
    },
    {
      question: 'Do approved timesheets affect billing?',
      answer: 'Yes, approved timesheets are included in milestone billing calculations and will appear in finance reports. The hourly rate is based on your resource\'s day rate configuration.'
    }
  ],
  
  related: ['expenses', 'deliverables', 'resources', 'billing', 'workflows', 'milestones']
};

export default timesheetsGuide;
