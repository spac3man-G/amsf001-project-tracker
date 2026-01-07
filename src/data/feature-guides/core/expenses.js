// Expense Feature Guide
// Complete how-to documentation for expense claim functionality

const expensesGuide = {
  id: 'expenses',
  title: 'Expenses',
  category: 'core',
  description: 'Submit and manage expense claims for project-related costs such as travel, accommodation, sustenance, and equipment. Expenses can be marked as chargeable to the customer and flow through a validation and approval workflow before reimbursement.',
  
  navigation: {
    path: '/expenses',
    sidebar: 'Time & Expenses → Expenses',
    quickAccess: 'Dashboard → My Draft Expenses widget',
    breadcrumb: 'Home > Time & Expenses > Expenses'
  },
  
  howTo: {
    create: {
      title: 'Creating an Expense Claim',
      steps: [
        'Navigate to the Expenses page from the sidebar (Time & Expenses → Expenses)',
        'Click the "New Expense" button in the top right corner',
        'Select the date the expense was incurred',
        'Choose the expense category from the dropdown (Travel, Accommodation, etc.)',
        'Enter the amount in the project currency',
        'Select whether this expense is chargeable to the customer',
        'Add a description of the expense',
        'Upload a receipt if required (see receipt requirements below)',
        'Click "Save as Draft" to save for later, or "Submit" to send for validation'
      ],
      tips: [
        'Receipts are required for expenses over £25 (or equivalent)',
        'Use the AI receipt scanner to auto-populate fields from a receipt image',
        'Keep descriptions clear and specific for faster validation',
        'Check the "Chargeable" box if the customer should be billed for this expense',
        'You can save drafts and add receipts later before submitting'
      ],
      videoUrl: null
    },
    uploadReceipt: {
      title: 'Uploading a Receipt',
      steps: [
        'In the expense form, find the "Receipt" section',
        'Click "Upload Receipt" or drag and drop an image file',
        'Supported formats: JPG, PNG, PDF (max 10MB)',
        'Wait for the upload to complete',
        'Preview the receipt to ensure it is legible',
        'Optionally, use "Scan Receipt" to auto-extract details'
      ],
      tips: [
        'Ensure receipt images are clear and legible',
        'PDFs work best for printed receipts',
        'Take photos in good lighting for handwritten receipts',
        'If a receipt is lost, add a note explaining the circumstances',
        'Multiple receipts can be combined into a single PDF before uploading'
      ]
    },
    aiScan: {
      title: 'Using AI Receipt Scanner',
      steps: [
        'Upload a receipt image first (JPG, PNG, or PDF)',
        'Click the "Scan Receipt" button below the uploaded image',
        'Wait for the AI to analyse the receipt (usually 2-5 seconds)',
        'Review the extracted information: merchant name, date, amount, and category',
        'Confirm or edit the extracted values',
        'The fields will be automatically populated with the scanned data'
      ],
      tips: [
        'Works best with clear, high-contrast receipt images',
        'The AI can read most printed receipts accurately',
        'Handwritten receipts may require manual entry',
        'Always verify the extracted amount matches the receipt',
        'The AI suggests a category based on the merchant type',
        'You can override any AI-suggested values before saving'
      ]
    },
    submit: {
      title: 'Submitting Expenses for Validation',
      steps: [
        'Navigate to the Expenses page',
        'Review your draft expenses to ensure accuracy',
        'Ensure receipts are attached for expenses requiring them',
        'Select the expenses you want to submit using the checkboxes',
        'Or use "Select All Drafts" to select all draft expenses',
        'Click the "Submit Selected" button',
        'Confirm the submission in the confirmation dialog',
        'Expenses will change to "Submitted" status'
      ],
      tips: [
        'Expenses over £25 must have receipts attached before submission',
        'Review the chargeable flag - once submitted this cannot be changed',
        'Submit expenses within the project expense claim period',
        'You will receive notifications when expenses are validated or rejected'
      ]
    },
    edit: {
      title: 'Editing an Expense',
      steps: [
        'Navigate to the Expenses page',
        'Find the expense you want to edit in the list',
        'Click the edit icon (pencil) on the row, or click the row to open details',
        'Make your changes to date, amount, category, or other fields',
        'Upload or replace the receipt if needed',
        'Click "Save" to save your changes'
      ],
      tips: [
        'Only expenses in "Draft" status can be edited',
        'If an expense has been submitted, ask a PM to reject it first',
        'Rejected expenses return to Draft status for editing'
      ]
    },
    view: {
      title: 'Viewing Expenses',
      steps: [
        'Navigate to the Expenses page',
        'Use the status filter to show specific statuses (Draft, Submitted, etc.)',
        'Use the category filter to view expenses by type',
        'Use the date range filter to narrow down to a specific period',
        'Use the "Chargeable" toggle to filter by chargeable status',
        'Click on any row to see full details including receipt preview',
        'Use the summary cards at the top for quick totals'
      ],
      tips: [
        'The default view shows your own expenses only',
        'PMs and Admins can see all team expenses using the resource filter',
        'Export to CSV for expense reporting',
        'Click the receipt thumbnail to view full-size'
      ]
    },
    validate: {
      title: 'Validating Expenses (Supplier PM/Admin only)',
      steps: [
        'Navigate to the Expenses page',
        'Filter by status "Submitted" to see expenses awaiting validation',
        'Review each expense - check amount, category, receipt, and chargeable status',
        'Click the receipt image to verify it matches the claimed amount',
        'Select expenses to validate using checkboxes',
        'Click "Validate Selected" to approve them',
        'Or click "Reject" on individual expenses with rejection notes',
        'Validated expenses will move to "Validated" status'
      ],
      tips: [
        'Always verify receipt amounts match the claimed amounts',
        'Check that the category is appropriate for the expense type',
        'Ensure chargeable expenses have customer-approved categories',
        'Add clear rejection notes if rejecting an expense'
      ]
    },
    approve: {
      title: 'Approving Expenses (Customer PM only)',
      steps: [
        'Navigate to the Expenses page',
        'Filter by status "Validated" to see expenses awaiting approval',
        'Review the validated expenses, especially those marked as chargeable',
        'Select expenses to approve using checkboxes',
        'Click "Approve Selected" to give final approval',
        'Approved expenses will move to "Approved" status'
      ],
      tips: [
        'Only Customer PM role can give final approval',
        'Chargeable expenses will be included in customer billing',
        'Non-chargeable expenses are internal costs only',
        'You can reject back to the supplier team if issues are found'
      ]
    }
  },
  
  fields: {
    date: {
      name: 'Date',
      label: 'Expense Date',
      required: true,
      type: 'date',
      description: 'The date the expense was incurred',
      validation: 'Must be within the project date range and not in the future',
      tips: 'Use the actual date from the receipt. Cannot claim future expenses.',
      format: 'DD/MM/YYYY'
    },
    amount: {
      name: 'Amount',
      label: 'Amount',
      required: true,
      type: 'currency',
      description: 'The total expense amount in the project currency',
      validation: 'Must be greater than 0. Maximum single expense: £10,000',
      tips: 'Enter the exact amount from the receipt including VAT. Use decimal format (e.g., 45.50).',
      min: 0.01,
      max: 10000
    },
    category: {
      name: 'Category',
      label: 'Expense Category',
      required: true,
      type: 'select',
      description: 'The type of expense being claimed',
      values: ['Travel', 'Accommodation', 'Sustenance', 'Equipment', 'Software', 'Training', 'Other'],
      tips: 'Select the most appropriate category. This affects reporting and billing categorisation.'
    },
    description: {
      name: 'Description',
      label: 'Description',
      required: true,
      type: 'textarea',
      description: 'Details about the expense including purpose and context',
      validation: 'Required. Maximum 500 characters.',
      tips: 'Be specific: "Train to London for client meeting" is better than "Travel".'
    },
    chargeable: {
      name: 'Chargeable',
      label: 'Chargeable to Customer',
      required: true,
      type: 'boolean',
      description: 'Whether this expense should be billed to the customer',
      tips: 'Check this if the expense is in scope and the customer should pay. Unchargeable expenses are internal costs.',
      default: false
    },
    receipt: {
      name: 'Receipt',
      label: 'Receipt',
      required: 'Conditional - required for expenses over £25',
      type: 'file',
      description: 'Scanned or photographed receipt as proof of expense',
      validation: 'JPG, PNG, or PDF. Maximum file size 10MB.',
      tips: 'Ensure the receipt clearly shows the merchant, date, and amount. Use the AI scanner to auto-fill fields.'
    },
    merchant: {
      name: 'Merchant',
      label: 'Merchant / Supplier',
      required: false,
      type: 'text',
      description: 'Name of the vendor or supplier',
      tips: 'Can be auto-populated by the AI receipt scanner. Useful for tracking and reporting.'
    },
    notes: {
      name: 'Notes',
      label: 'Additional Notes',
      required: false,
      type: 'textarea',
      description: 'Any additional context or notes about the expense',
      validation: 'Maximum 500 characters',
      tips: 'Add context for validators. Explain unusual expenses or missing receipts.'
    },
    status: {
      name: 'Status',
      label: 'Status',
      required: false,
      type: 'readonly',
      description: 'Current validation status of the expense',
      values: ['Draft', 'Submitted', 'Validated', 'Approved', 'Rejected'],
      tips: 'Status is managed by the workflow, not edited directly.'
    },
    resource_id: {
      name: 'Resource',
      label: 'Resource',
      required: true,
      type: 'auto',
      description: 'The team member claiming this expense',
      tips: 'Automatically set to your linked resource. PMs can create expenses for other team members.'
    }
  },
  
  categories: {
    travel: {
      name: 'Travel',
      description: 'Transportation costs including flights, trains, taxis, car hire, mileage, and parking',
      examples: ['Train tickets', 'Flight bookings', 'Taxi fares', 'Uber/Lyft', 'Car hire', 'Fuel', 'Parking fees', 'Congestion charges'],
      receiptRequired: true,
      typicallyChargeable: true
    },
    accommodation: {
      name: 'Accommodation',
      description: 'Hotel and lodging costs for project-related travel',
      examples: ['Hotel rooms', 'Serviced apartments', 'Airbnb (if approved)'],
      receiptRequired: true,
      typicallyChargeable: true
    },
    sustenance: {
      name: 'Sustenance',
      description: 'Food and drink expenses during project work or travel',
      examples: ['Working meals', 'Client entertainment', 'Team meals', 'Conference catering'],
      receiptRequired: 'Over £25',
      typicallyChargeable: false,
      notes: 'Client entertainment may be chargeable if pre-approved'
    },
    equipment: {
      name: 'Equipment',
      description: 'Hardware and physical equipment purchases for the project',
      examples: ['Monitors', 'Keyboards', 'Cables', 'Storage devices', 'Presentation equipment'],
      receiptRequired: true,
      typicallyChargeable: true,
      notes: 'Equipment over £500 may require pre-approval'
    },
    software: {
      name: 'Software',
      description: 'Software licenses and subscriptions for project work',
      examples: ['SaaS subscriptions', 'Software licenses', 'Cloud services', 'Development tools'],
      receiptRequired: true,
      typicallyChargeable: true
    },
    training: {
      name: 'Training',
      description: 'Training courses and certifications related to project work',
      examples: ['Online courses', 'Certification exams', 'Conference tickets', 'Workshop fees'],
      receiptRequired: true,
      typicallyChargeable: false,
      notes: 'Training expenses usually require pre-approval'
    },
    other: {
      name: 'Other',
      description: 'Any expense that does not fit into the above categories',
      examples: ['Printing costs', 'Postage', 'Stationery', 'Miscellaneous'],
      receiptRequired: 'Over £25',
      typicallyChargeable: false,
      notes: 'Include detailed description when using this category'
    }
  },
  
  workflow: {
    title: 'Expense Approval Workflow',
    description: 'Expenses follow a validation and approval process similar to timesheets, ensuring proper review before reimbursement and customer billing.',
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
        description: 'Expense created but not yet submitted. Can be edited or deleted.',
        colour: 'grey'
      },
      { 
        name: 'Submitted', 
        description: 'Expense submitted for validation. Awaiting Supplier PM review.',
        colour: 'blue'
      },
      { 
        name: 'Validated', 
        description: 'Expense validated by Supplier PM. Awaiting Customer PM approval.',
        colour: 'amber'
      },
      { 
        name: 'Approved', 
        description: 'Expense approved by Customer PM. Cleared for reimbursement and billing.',
        colour: 'green'
      },
      { 
        name: 'Rejected', 
        description: 'Expense rejected and returned to draft status with notes.',
        colour: 'red'
      }
    ],
    transitions: [
      { 
        from: 'Draft', 
        to: 'Submitted', 
        action: 'Submit', 
        actor: 'Creator (any role)',
        description: 'User submits their expense for validation'
      },
      { 
        from: 'Submitted', 
        to: 'Validated', 
        action: 'Validate', 
        actor: 'Supplier PM or Admin',
        description: 'Supplier PM confirms expense is valid with proper receipt'
      },
      { 
        from: 'Submitted', 
        to: 'Rejected', 
        action: 'Reject', 
        actor: 'Supplier PM or Admin',
        description: 'Supplier PM returns expense with rejection notes'
      },
      { 
        from: 'Validated', 
        to: 'Approved', 
        action: 'Approve', 
        actor: 'Customer PM',
        description: 'Customer PM gives final approval'
      },
      { 
        from: 'Validated', 
        to: 'Rejected', 
        action: 'Reject', 
        actor: 'Customer PM',
        description: 'Customer PM returns expense with rejection notes'
      },
      { 
        from: 'Rejected', 
        to: 'Draft', 
        action: 'Auto-revert', 
        actor: 'System',
        description: 'Rejected expenses automatically return to draft status'
      }
    ]
  },
  
  permissions: {
    contributor: {
      role: 'Contributor',
      canView: 'Own expenses only',
      canCreate: true,
      canEdit: 'Own draft expenses only',
      canDelete: 'Own draft expenses only',
      canSubmit: true,
      canValidate: false,
      canApprove: false,
      notes: 'Contributors can only see and manage their own expense claims'
    },
    supplier_pm: {
      role: 'Supplier PM',
      canView: 'All expenses in project',
      canCreate: true,
      canEdit: 'All draft expenses',
      canDelete: 'All draft expenses',
      canSubmit: true,
      canValidate: true,
      canApprove: false,
      notes: 'Supplier PMs validate expenses before customer approval'
    },
    customer_pm: {
      role: 'Customer PM',
      canView: 'All expenses in project',
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canSubmit: false,
      canValidate: false,
      canApprove: true,
      notes: 'Customer PMs give final approval for billing and reimbursement'
    },
    admin: {
      role: 'Admin',
      canView: 'All expenses in project',
      canCreate: true,
      canEdit: 'All draft expenses',
      canDelete: 'All draft expenses',
      canSubmit: true,
      canValidate: true,
      canApprove: true,
      notes: 'Admins have full access to all expense operations'
    },
    partner_admin: {
      role: 'Partner Admin',
      canView: 'Partner team expenses only',
      canCreate: true,
      canEdit: 'Partner team draft expenses',
      canDelete: 'Partner team draft expenses',
      canSubmit: true,
      canValidate: false,
      canApprove: false,
      notes: 'Partner Admins manage expenses for their partner team'
    },
    partner_user: {
      role: 'Partner User',
      canView: 'Own expenses only',
      canCreate: true,
      canEdit: 'Own draft expenses only',
      canDelete: 'Own draft expenses only',
      canSubmit: true,
      canValidate: false,
      canApprove: false,
      notes: 'Partner Users can only manage their own expense claims'
    }
  },
  
  faq: [
    {
      question: 'When is a receipt required?',
      answer: 'Receipts are required for all expenses over £25 (or equivalent in project currency). Even for smaller amounts, receipts are recommended for audit purposes. Some categories like Equipment always require receipts regardless of amount.'
    },
    {
      question: 'How do I use the AI receipt scanner?',
      answer: 'Upload a clear image of your receipt first, then click "Scan Receipt". The AI will extract the merchant name, date, amount, and suggest a category. Review the extracted information and make any corrections before saving.'
    },
    {
      question: 'What does "Chargeable to Customer" mean?',
      answer: 'Chargeable expenses are billed to the customer as part of project costs. Non-chargeable expenses are internal costs absorbed by the supplier. The chargeable flag affects billing and reporting.'
    },
    {
      question: 'Can I edit a submitted expense?',
      answer: 'No, once submitted, expenses cannot be edited. Ask a Supplier PM or Admin to reject it back to Draft status, then you can make changes and resubmit.'
    },
    {
      question: 'What expense categories are available?',
      answer: 'The available categories are: Travel (transport), Accommodation (hotels), Sustenance (meals), Equipment (hardware), Software (licenses), Training (courses), and Other. Choose the most appropriate category for accurate reporting.'
    },
    {
      question: 'How are expenses reimbursed?',
      answer: 'Once expenses reach "Approved" status, they are cleared for reimbursement. The actual reimbursement process is handled outside this system by your finance team, typically via payroll or direct payment.'
    },
    {
      question: 'Can I claim expenses in a different currency?',
      answer: 'Expenses should be entered in the project currency. If you incurred costs in a different currency, convert to the project currency using the exchange rate from the date of the expense. Include the original currency amount in the notes.'
    },
    {
      question: 'What if I lost my receipt?',
      answer: 'If a receipt is lost, add a note explaining the circumstances and include as much detail as possible (merchant, date, amount). The validator may request additional evidence or may approve without receipt for smaller amounts.'
    },
    {
      question: 'How do I view all my expenses?',
      answer: 'Navigate to the Expenses page. By default, you see your own expenses. Use the date range filter to view historical expenses, or remove all filters to see everything. Export to CSV for full records.'
    },
    {
      question: 'Why was my expense rejected?',
      answer: 'Check the rejection notes on the expense for details. Common reasons include: missing receipt, unclear description, incorrect category, or amount doesn\'t match receipt. Fix the issues and resubmit.'
    },
    {
      question: 'Can I claim expenses from before the project started?',
      answer: 'Expenses must be within the project date range. Pre-project expenses cannot usually be claimed unless specifically approved. Contact your PM if you have legitimate pre-project costs.'
    },
    {
      question: 'Who can see my expenses?',
      answer: 'Contributors can only see their own expenses. PMs and Admins can see all expenses in the project. Partner users can only see their own expenses, while Partner Admins can see all expenses from their partner team.'
    }
  ],
  
  related: ['timesheets', 'billing', 'resources', 'workflows', 'milestones']
};

export default expensesGuide;
