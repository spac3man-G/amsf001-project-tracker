// Partner Invoices Feature Guide
// Complete how-to documentation for partner invoice management functionality

const partnerInvoicesGuide = {
  id: 'partner-invoices',
  title: 'Partner Invoices',
  category: 'finance',
  description: 'Manage invoices from partner organisations working on the project. Create, track, and process partner invoices through the approval workflow, record payments, and reconcile against partner work.',
  
  navigation: {
    path: '/finance/partner-invoices',
    sidebar: 'Finance → Partner Invoices',
    quickAccess: 'Dashboard → Partner Costs widget',
    breadcrumb: 'Home > Finance > Partner Invoices'
  },
  
  howTo: {
    create: {
      title: 'Creating a Partner Invoice',
      steps: [
        'Navigate to Partner Invoices from the sidebar (Finance → Partner Invoices)',
        'Click "New Invoice" button in the top right',
        'Select the Partner organisation from the dropdown',
        'Enter the invoice number (from the partner\'s invoice)',
        'Enter the invoice date',
        'Set the due date for payment',
        'Add line items for the work being invoiced',
        'Attach the PDF of the partner\'s invoice (required)',
        'Click "Save as Draft" or "Submit for Approval"'
      ],
      tips: [
        'Use the partner\'s invoice number for easy reconciliation',
        'Due date defaults to 30 days but can be adjusted',
        'Line items should match approved partner timesheets',
        'Upload the original invoice document for audit'
      ]
    },
    addLineItems: {
      title: 'Adding Invoice Line Items',
      steps: [
        'In the invoice form, scroll to the Line Items section',
        'Click "Add Line Item" to add a new row',
        'Enter a description for the line item',
        'Select the milestone this work relates to (optional)',
        'Enter the quantity (usually 1 for lump sums)',
        'Enter the unit price or total amount',
        'The line total calculates automatically',
        'Repeat for each line item',
        'The invoice total updates as you add items'
      ],
      lineItemTypes: [
        { type: 'Time & Materials', description: 'Based on approved timesheets - days × rate' },
        { type: 'Fixed Price', description: 'Milestone payment at agreed amount' },
        { type: 'Expenses', description: 'Reimbursable expenses with receipts' },
        { type: 'Other', description: 'Ad-hoc items as agreed' }
      ],
      tips: [
        'Match line items to partner work for easy verification',
        'Link to milestones for accurate budget tracking',
        'Add detailed descriptions for audit trail',
        'Check totals against partner\'s invoice document'
      ]
    },
    submit: {
      title: 'Submitting Invoice for Approval',
      steps: [
        'Review the invoice details for accuracy',
        'Ensure the invoice document is attached',
        'Verify line items match the partner\'s invoice',
        'Check the total matches the partner\'s invoice',
        'Click "Submit for Approval"',
        'The invoice moves to "Submitted" status',
        'Approvers receive a notification',
        'Track progress in the invoice list'
      ],
      tips: [
        'Draft invoices can be edited freely',
        'Submitted invoices are locked for editing',
        'If changes needed, approver can reject back to draft',
        'Add notes for approvers if anything needs explanation'
      ]
    },
    approve: {
      title: 'Approving Partner Invoices',
      steps: [
        'Navigate to Partner Invoices and filter by "Submitted" status',
        'Click on an invoice to open the detail view',
        'Review the invoice details and line items',
        'Download and verify the attached invoice document',
        'Check line items against approved partner timesheets',
        'Verify the partner has delivered the invoiced work',
        'Click "Approve" to approve, or "Reject" with notes',
        'Approved invoices move to "Approved" status'
      ],
      verificationChecklist: [
        'Invoice number matches attached document',
        'Invoice date and due date are correct',
        'Line items match agreed rates and work',
        'Total matches attached invoice document',
        'Work has been delivered and validated',
        'Within budget allocation for partner'
      ],
      tips: [
        'Only Admin and Supplier PM can approve invoices',
        'Cross-check against partner timesheets before approving',
        'Rejected invoices return to partner for correction',
        'Approval creates financial commitment'
      ]
    },
    recordPayment: {
      title: 'Recording Invoice Payment',
      steps: [
        'Navigate to Partner Invoices and filter by "Approved" status',
        'Click on an invoice to open details',
        'Click "Record Payment" button',
        'Enter the payment date',
        'Enter the payment amount (full or partial)',
        'Select the payment method: Bank Transfer, Cheque, etc.',
        'Enter the payment reference (e.g., bank transaction ID)',
        'Click "Save Payment"',
        'Invoice status updates based on payment amount'
      ],
      paymentStatuses: [
        { status: 'Unpaid', description: 'No payment recorded' },
        { status: 'Partially Paid', description: 'Payment less than invoice total' },
        { status: 'Paid', description: 'Full payment recorded' }
      ],
      tips: [
        'Partial payments are supported',
        'Payment reference helps with reconciliation',
        'Payment date should match bank records',
        'Multiple payments can be recorded against one invoice'
      ]
    },
    view: {
      title: 'Viewing Invoice Status and History',
      steps: [
        'Navigate to Partner Invoices from the sidebar',
        'The list shows all invoices with current status',
        'Use filters to narrow by: Partner, Status, Date Range, Amount',
        'Click column headers to sort the list',
        'Click any invoice to see full details',
        'The detail view shows: line items, approval history, payments',
        'Use the Activity tab to see all actions on the invoice'
      ],
      tips: [
        'Summary cards show totals by status',
        'Overdue invoices are highlighted in red',
        'Export the list for reporting',
        'Set up alerts for approaching due dates'
      ]
    },
    handleOverdue: {
      title: 'Handling Overdue Invoices',
      steps: [
        'Invoices automatically become "Overdue" after the due date',
        'View overdue invoices using the Status filter',
        'Click on an overdue invoice to see details',
        'Review the payment history',
        'Contact the partner if payment was made but not recorded',
        'Update due date if extension was agreed',
        'Record payment once received',
        'Add notes documenting any follow-up actions'
      ],
      tips: [
        'Overdue aging shows how long overdue (30, 60, 90+ days)',
        'Set up notifications for overdue invoices',
        'Document any payment disputes or issues',
        'Consider impact on partner relationship'
      ]
    },
    reconcile: {
      title: 'Reconciling Partner Invoices',
      steps: [
        'Navigate to Partner Invoices',
        'Click "Reconciliation" tab',
        'Select the Partner and date range',
        'View: Partner Timesheets vs Invoiced Amounts',
        'Identify any discrepancies',
        'Drill down to specific timesheets and invoices',
        'Document reconciliation notes',
        'Export reconciliation report'
      ],
      reconciliationViews: [
        { view: 'By Partner', description: 'Total invoiced vs total approved time' },
        { view: 'By Milestone', description: 'Partner costs against milestone budgets' },
        { view: 'By Period', description: 'Monthly invoice vs timesheet totals' }
      ],
      tips: [
        'Reconcile monthly to catch issues early',
        'Investigate significant discrepancies',
        'Keep reconciliation notes for audit',
        'Use export for finance system import'
      ]
    },
    bulkActions: {
      title: 'Bulk Invoice Actions',
      steps: [
        'From the invoice list, use checkboxes to select multiple invoices',
        'Click "Bulk Actions" dropdown',
        'Choose action: Approve All, Export Selected, Change Status',
        'Confirm the action in the dialog',
        'Results show which invoices were processed',
        'Failed items are listed with reasons'
      ],
      bulkOptions: [
        { action: 'Approve Selected', description: 'Approve multiple submitted invoices' },
        { action: 'Export Selected', description: 'Export invoices to Excel' },
        { action: 'Mark Overdue', description: 'Manually flag invoices as overdue' }
      ],
      tips: [
        'Review each invoice before bulk approval',
        'Bulk actions are logged in audit trail',
        'Use filters first to select the right invoices'
      ]
    }
  },
  
  fields: {
    invoice_number: {
      name: 'Invoice Number',
      label: 'Invoice #',
      required: true,
      type: 'text',
      description: 'The invoice number from the partner\'s invoice',
      validation: 'Required. Must be unique per partner.',
      tips: 'Use the exact number from the partner\'s document'
    },
    partner_id: {
      name: 'Partner',
      label: 'Partner Organisation',
      required: true,
      type: 'select',
      description: 'The partner organisation submitting the invoice',
      validation: 'Required. Must be an active partner.',
      tips: 'Partner must be set up in the project first'
    },
    invoice_date: {
      name: 'Invoice Date',
      label: 'Invoice Date',
      required: true,
      type: 'date',
      description: 'The date on the partner\'s invoice',
      validation: 'Required. Cannot be in the future.',
      tips: 'Use the date from the partner\'s invoice document',
      format: 'DD/MM/YYYY'
    },
    due_date: {
      name: 'Due Date',
      label: 'Due Date',
      required: true,
      type: 'date',
      description: 'When payment is due to the partner',
      validation: 'Required. Must be after invoice date.',
      tips: 'Typically 30 days from invoice date. Check partner terms.',
      format: 'DD/MM/YYYY'
    },
    status: {
      name: 'Status',
      label: 'Status',
      required: false,
      type: 'readonly',
      description: 'Current status of the invoice',
      values: ['Draft', 'Submitted', 'Approved', 'Rejected', 'Paid', 'Partially Paid', 'Overdue', 'Cancelled'],
      tips: 'Status progresses through workflow automatically'
    },
    total_amount: {
      name: 'Total Amount',
      label: 'Total (£)',
      required: true,
      type: 'currency',
      description: 'Total invoice amount',
      calculation: 'Sum of all line item totals',
      tips: 'Must match the partner\'s invoice document'
    },
    amount_paid: {
      name: 'Amount Paid',
      label: 'Paid (£)',
      required: false,
      type: 'currency',
      description: 'Total payments recorded against this invoice',
      calculation: 'Sum of all payment amounts',
      tips: 'Updated when payments are recorded'
    },
    amount_outstanding: {
      name: 'Outstanding',
      label: 'Outstanding (£)',
      required: false,
      type: 'currency',
      description: 'Amount still to be paid',
      calculation: 'Total Amount - Amount Paid',
      tips: 'Zero when fully paid'
    },
    line_description: {
      name: 'Description',
      label: 'Line Description',
      required: true,
      type: 'text',
      description: 'Description of the invoiced work',
      validation: 'Required. Maximum 500 characters.',
      tips: 'Be specific about the work covered'
    },
    line_milestone: {
      name: 'Milestone',
      label: 'Milestone',
      required: false,
      type: 'select',
      description: 'The milestone this line item relates to',
      tips: 'Links cost to milestone budget for tracking'
    },
    line_quantity: {
      name: 'Quantity',
      label: 'Qty',
      required: true,
      type: 'number',
      description: 'Quantity of units (days, items, etc.)',
      validation: 'Required. Must be positive.',
      tips: 'Use 1 for lump sum amounts',
      min: 0.01
    },
    line_unit_price: {
      name: 'Unit Price',
      label: 'Unit Price (£)',
      required: true,
      type: 'currency',
      description: 'Price per unit',
      validation: 'Required. Must be positive.',
      tips: 'For T&M, this is the day rate'
    },
    line_total: {
      name: 'Line Total',
      label: 'Total (£)',
      required: false,
      type: 'currency',
      description: 'Total for this line item',
      calculation: 'Quantity × Unit Price',
      tips: 'Calculated automatically'
    },
    attachment: {
      name: 'Invoice Document',
      label: 'Attachment',
      required: true,
      type: 'file',
      description: 'The partner\'s invoice document (PDF)',
      validation: 'Required. PDF format recommended.',
      tips: 'Upload the original invoice for audit purposes'
    },
    notes: {
      name: 'Notes',
      label: 'Notes',
      required: false,
      type: 'textarea',
      description: 'Additional notes or comments',
      validation: 'Maximum 2000 characters',
      tips: 'Add context for approvers or payment notes'
    },
    payment_date: {
      name: 'Payment Date',
      label: 'Payment Date',
      required: true,
      type: 'date',
      description: 'Date the payment was made',
      validation: 'Required when recording payment.',
      tips: 'Use the date payment left your account',
      format: 'DD/MM/YYYY'
    },
    payment_reference: {
      name: 'Payment Reference',
      label: 'Reference',
      required: false,
      type: 'text',
      description: 'Bank reference or cheque number',
      tips: 'Helps with reconciliation to bank statements'
    },
    payment_method: {
      name: 'Payment Method',
      label: 'Method',
      required: true,
      type: 'select',
      description: 'How the payment was made',
      values: ['Bank Transfer', 'Cheque', 'Direct Debit', 'Card', 'Other'],
      tips: 'Bank Transfer is most common for partner payments'
    }
  },
  
  workflow: {
    title: 'Partner Invoice Workflow',
    description: 'Invoices progress through a submission, approval, and payment workflow.',
    diagram: `
    ┌─────────┐     Submit     ┌───────────┐    Approve    ┌──────────┐    Payment    ┌────────┐
    │  Draft  │ ──────────────>│ Submitted │ ─────────────>│ Approved │ ─────────────>│  Paid  │
    └─────────┘                └───────────┘               └──────────┘               └────────┘
         ^                          │                           │                          │
         │        Reject            │                           │                          │
         └──────────────────────────┘                           │        Partial           │
                                                                └─────────────────────────>│
                                                                                    Partially Paid
    
    Note: Invoices past due date automatically become "Overdue"
    `,
    statuses: [
      { 
        name: 'Draft', 
        description: 'Invoice being created. Can be edited or deleted.',
        colour: 'grey'
      },
      { 
        name: 'Submitted', 
        description: 'Invoice submitted for approval. Awaiting review.',
        colour: 'blue'
      },
      { 
        name: 'Approved', 
        description: 'Invoice approved. Ready for payment.',
        colour: 'green'
      },
      { 
        name: 'Rejected', 
        description: 'Invoice rejected. Returns to draft for correction.',
        colour: 'red'
      },
      { 
        name: 'Partially Paid', 
        description: 'Some payment received. Balance outstanding.',
        colour: 'amber'
      },
      { 
        name: 'Paid', 
        description: 'Full payment recorded. Invoice complete.',
        colour: 'green'
      },
      { 
        name: 'Overdue', 
        description: 'Past due date and not fully paid.',
        colour: 'red'
      },
      { 
        name: 'Cancelled', 
        description: 'Invoice cancelled and voided.',
        colour: 'grey'
      }
    ],
    transitions: [
      { 
        from: 'Draft', 
        to: 'Submitted', 
        action: 'Submit', 
        actor: 'Partner Admin or Supplier PM',
        description: 'Submit invoice for approval'
      },
      { 
        from: 'Submitted', 
        to: 'Approved', 
        action: 'Approve', 
        actor: 'Supplier PM or Admin',
        description: 'Approve invoice for payment'
      },
      { 
        from: 'Submitted', 
        to: 'Rejected', 
        action: 'Reject', 
        actor: 'Supplier PM or Admin',
        description: 'Reject invoice with notes'
      },
      { 
        from: 'Rejected', 
        to: 'Draft', 
        action: 'Edit', 
        actor: 'Partner Admin or Supplier PM',
        description: 'Return to draft for corrections'
      },
      { 
        from: 'Approved', 
        to: 'Partially Paid', 
        action: 'Record Payment', 
        actor: 'Admin',
        description: 'Record partial payment'
      },
      { 
        from: 'Approved', 
        to: 'Paid', 
        action: 'Record Payment', 
        actor: 'Admin',
        description: 'Record full payment'
      },
      { 
        from: 'Partially Paid', 
        to: 'Paid', 
        action: 'Record Payment', 
        actor: 'Admin',
        description: 'Record remaining payment'
      },
      { 
        from: 'Approved', 
        to: 'Overdue', 
        action: 'Auto', 
        actor: 'System',
        description: 'Automatic when past due date'
      },
      { 
        from: 'Draft', 
        to: 'Cancelled', 
        action: 'Cancel', 
        actor: 'Admin',
        description: 'Cancel and void invoice'
      }
    ]
  },
  
  permissions: {
    contributor: {
      role: 'Contributor',
      canView: false,
      canCreate: false,
      canEdit: false,
      canSubmit: false,
      canApprove: false,
      canRecordPayment: false,
      notes: 'Contributors do not have access to partner invoices'
    },
    supplier_pm: {
      role: 'Supplier PM',
      canView: true,
      canCreate: true,
      canEdit: 'Draft invoices',
      canSubmit: true,
      canApprove: true,
      canRecordPayment: false,
      notes: 'Supplier PMs manage and approve partner invoices'
    },
    customer_pm: {
      role: 'Customer PM',
      canView: 'Summary only',
      canCreate: false,
      canEdit: false,
      canSubmit: false,
      canApprove: false,
      canRecordPayment: false,
      notes: 'Customer PMs see partner cost summaries only'
    },
    admin: {
      role: 'Admin',
      canView: true,
      canCreate: true,
      canEdit: 'All invoices',
      canSubmit: true,
      canApprove: true,
      canRecordPayment: true,
      notes: 'Admins have full access including payment recording'
    },
    partner_admin: {
      role: 'Partner Admin',
      canView: 'Own partner invoices',
      canCreate: true,
      canEdit: 'Own draft invoices',
      canSubmit: true,
      canApprove: false,
      canRecordPayment: false,
      notes: 'Partner Admins create and submit invoices for their organisation'
    },
    partner_user: {
      role: 'Partner User',
      canView: 'Own partner invoices (read only)',
      canCreate: false,
      canEdit: false,
      canSubmit: false,
      canApprove: false,
      canRecordPayment: false,
      notes: 'Partner Users can view their organisation\'s invoices'
    }
  },
  
  faq: [
    {
      question: 'Who can create partner invoices?',
      answer: 'Partner Admins can create invoices for their own organisation. Supplier PMs and Admins can create invoices on behalf of any partner. This allows both self-service and managed invoice entry.'
    },
    {
      question: 'What documents should be attached?',
      answer: 'Attach the PDF of the partner\'s original invoice. This is required for approval and audit purposes. Supporting documents like timesheets can also be attached but aren\'t mandatory.'
    },
    {
      question: 'How do I handle invoice disputes?',
      answer: 'Reject the invoice with detailed notes explaining the issue. The invoice returns to Draft status where it can be corrected. Use the Notes field to document the dispute and resolution.'
    },
    {
      question: 'Can I record partial payments?',
      answer: 'Yes, you can record multiple payments against an invoice. The status shows "Partially Paid" until the total payments equal the invoice amount, then it becomes "Paid".'
    },
    {
      question: 'What happens when an invoice is overdue?',
      answer: 'Invoices automatically change to "Overdue" status after the due date if not fully paid. This is flagged in the dashboard and reports. Record the payment to clear the overdue status.'
    },
    {
      question: 'How do partner invoices affect project budgets?',
      answer: 'Approved partner invoices are included in project actual costs. Line items linked to milestones appear in milestone cost tracking. This ensures accurate budget vs actual reporting.'
    },
    {
      question: 'Can I cancel an invoice?',
      answer: 'Draft invoices can be cancelled by Admins. Submitted or Approved invoices should be rejected back to draft first. Cancelled invoices are retained for audit but excluded from reporting.'
    },
    {
      question: 'How do I reconcile partner invoices with timesheets?',
      answer: 'Use the Reconciliation view to compare partner timesheets against invoiced amounts. This helps verify that invoices match approved work and identifies any discrepancies.'
    },
    {
      question: 'What are the payment terms?',
      answer: 'Payment terms are set per partner in Project Settings. The default is 30 days. The due date is calculated from the invoice date based on these terms, but can be manually adjusted.'
    },
    {
      question: 'Can partners see the status of their invoices?',
      answer: 'Yes, Partner Admins and Partner Users can view invoices for their organisation. They can see status, payment history, and any rejection notes. They cannot approve their own invoices.'
    }
  ],
  
  related: ['billing', 'timesheets', 'expenses', 'resources', 'milestones']
};

export default partnerInvoicesGuide;
