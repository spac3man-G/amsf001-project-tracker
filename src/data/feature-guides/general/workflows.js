// Workflows Feature Guide
// Complete how-to documentation for understanding approval workflows

const workflowsGuide = {
  id: 'workflows',
  title: 'Approval Workflows',
  category: 'general',
  description: 'Understand how items flow through approval processes. Learn the workflow stages for timesheets, expenses, variations, deliverables, and milestone certificates, including who can take action at each stage.',
  
  navigation: {
    path: '/help/workflows',
    sidebar: 'Help → Workflows',
    quickAccess: 'Help Menu → Understanding Workflows',
    breadcrumb: 'Home > Help > Workflows'
  },
  
  overview: {
    title: 'Understanding Workflows',
    description: 'Workflows ensure proper review and approval before items are finalised. Each workflow has defined stages, actors, and transitions.',
    keyPrinciples: [
      'Items progress through stages from creation to completion',
      'Each stage has specific actors who can take action',
      'Transitions move items between stages',
      'Rejected items return to earlier stages for correction',
      'Approved items are locked from further editing',
      'Notifications alert relevant people at each transition'
    ]
  },
  
  workflows: {
    timesheet: {
      title: 'Timesheet Approval Workflow',
      description: 'Timesheets go through validation by supplier and approval by customer before being included in billing.',
      diagram: `
      ┌─────────┐     Submit      ┌───────────┐    Validate    ┌───────────┐    Approve    ┌──────────┐
      │  Draft  │ ───────────────>│ Submitted │ ──────────────>│ Validated │ ─────────────>│ Approved │
      └─────────┘                 └───────────┘                └───────────┘               └──────────┘
           ^                           │                             │
           │         Reject            │           Reject            │
           └───────────────────────────┴─────────────────────────────┘
      `,
      stages: [
        { 
          stage: 'Draft',
          description: 'Entry created but not submitted',
          actor: 'Creator',
          actions: ['Edit', 'Delete', 'Submit'],
          colour: 'grey'
        },
        {
          stage: 'Submitted',
          description: 'Awaiting validation by supplier',
          actor: 'Supplier PM / Admin',
          actions: ['Validate', 'Reject'],
          colour: 'blue'
        },
        {
          stage: 'Validated',
          description: 'Awaiting customer approval',
          actor: 'Customer PM',
          actions: ['Approve', 'Reject'],
          colour: 'amber'
        },
        {
          stage: 'Approved',
          description: 'Final - included in billing',
          actor: 'None (complete)',
          actions: ['None'],
          colour: 'green'
        },
        {
          stage: 'Rejected',
          description: 'Returned for correction',
          actor: 'Original creator',
          actions: ['Edit', 'Resubmit'],
          colour: 'red'
        }
      ],
      tips: [
        'Submit timesheets weekly for timely approval',
        'Include notes to help validators understand the work',
        'Rejected entries show rejection reason'
      ]
    },
    
    expense: {
      title: 'Expense Approval Workflow',
      description: 'Expense claims follow the same pattern as timesheets with validation then approval.',
      diagram: `
      ┌─────────┐     Submit      ┌───────────┐    Validate    ┌───────────┐    Approve    ┌──────────┐
      │  Draft  │ ───────────────>│ Submitted │ ──────────────>│ Validated │ ─────────────>│ Approved │
      └─────────┘                 └───────────┘                └───────────┘               └──────────┘
           ^                           │                             │
           │         Reject            │           Reject            │
           └───────────────────────────┴─────────────────────────────┘
      `,
      stages: [
        {
          stage: 'Draft',
          description: 'Expense created, not submitted',
          actor: 'Creator',
          actions: ['Edit', 'Attach Receipt', 'Delete', 'Submit'],
          colour: 'grey'
        },
        {
          stage: 'Submitted',
          description: 'Awaiting validation',
          actor: 'Supplier PM / Admin',
          actions: ['Validate', 'Reject'],
          colour: 'blue',
          checks: ['Receipt attached (if required)', 'Within policy limits', 'Correct category']
        },
        {
          stage: 'Validated',
          description: 'Awaiting customer approval',
          actor: 'Customer PM',
          actions: ['Approve', 'Reject'],
          colour: 'amber'
        },
        {
          stage: 'Approved',
          description: 'Final - ready for reimbursement',
          actor: 'None (complete)',
          actions: ['None'],
          colour: 'green'
        },
        {
          stage: 'Rejected',
          description: 'Returned for correction',
          actor: 'Original creator',
          actions: ['Edit', 'Attach Receipt', 'Resubmit'],
          colour: 'red'
        }
      ],
      tips: [
        'Attach receipts before submitting',
        'Include clear descriptions',
        'Check expense policy for limits'
      ]
    },
    
    variation: {
      title: 'Variation (Change Request) Workflow',
      description: 'Variations require review, approval, and implementation tracking.',
      diagram: `
      ┌─────────┐    Submit    ┌───────────┐    Review    ┌─────────────┐    Approve    ┌──────────┐    Complete    ┌─────────────┐
      │  Draft  │ ────────────>│ Submitted │ ───────────>│ Under Review│ ─────────────>│ Approved │ ──────────────>│ Implemented │
      └─────────┘              └───────────┘             └─────────────┘               └──────────┘                └─────────────┘
           ^                        │                          │                            │
           │        Reject          │          Reject          │          Reject           │
           └────────────────────────┴──────────────────────────┴────────────────────────────┘
      `,
      stages: [
        {
          stage: 'Draft',
          description: 'Variation being prepared',
          actor: 'Creator',
          actions: ['Edit', 'Delete', 'Submit'],
          colour: 'grey'
        },
        {
          stage: 'Submitted',
          description: 'Awaiting initial review',
          actor: 'Supplier PM / Admin',
          actions: ['Begin Review', 'Reject'],
          colour: 'blue'
        },
        {
          stage: 'Under Review',
          description: 'Impact being assessed',
          actor: 'Supplier PM / Admin',
          actions: ['Complete Review', 'Submit for Approval'],
          colour: 'amber'
        },
        {
          stage: 'Approved',
          description: 'Change authorised',
          actor: 'Customer PM / Admin',
          actions: ['Mark Implemented'],
          colour: 'green'
        },
        {
          stage: 'Implemented',
          description: 'Change has been actioned',
          actor: 'None (complete)',
          actions: ['None'],
          colour: 'green'
        },
        {
          stage: 'Rejected',
          description: 'Change not approved',
          actor: 'Creator',
          actions: ['Revise', 'Resubmit', 'Close'],
          colour: 'red'
        }
      ],
      tips: [
        'Document impact assessment thoroughly',
        'Link to affected milestones/deliverables',
        'Include cost and timeline impact'
      ]
    },
    
    deliverable: {
      title: 'Deliverable Review Workflow',
      description: 'Deliverables go through review before being marked as delivered.',
      diagram: `
      ┌─────────────┐    Start    ┌─────────────┐    Submit    ┌─────────────────┐    Accept    ┌───────────────┐
      │ Not Started │ ───────────>│ In Progress │ ────────────>│ Awaiting Review │ ────────────>│ Review Complete│
      └─────────────┘             └─────────────┘              └─────────────────┘              └───────────────┘
                                                                       │                               │
                                                                       │ Request Rework               │ Mark Delivered
                                                                       v                               v
                                                                ┌─────────────┐                ┌───────────┐
                                                                │   Rework    │                │ Delivered │
                                                                └─────────────┘                └───────────┘
      `,
      stages: [
        {
          stage: 'Not Started',
          description: 'Deliverable defined but work not begun',
          actor: 'Assigned resource',
          actions: ['Start Work'],
          colour: 'grey'
        },
        {
          stage: 'In Progress',
          description: 'Work underway',
          actor: 'Assigned resource',
          actions: ['Update Progress', 'Submit for Review'],
          colour: 'blue'
        },
        {
          stage: 'Awaiting Review',
          description: 'Submitted for customer review',
          actor: 'Customer PM',
          actions: ['Accept', 'Request Rework'],
          colour: 'amber'
        },
        {
          stage: 'Review Complete',
          description: 'Review passed',
          actor: 'Supplier PM',
          actions: ['Mark as Delivered'],
          colour: 'green'
        },
        {
          stage: 'Rework',
          description: 'Changes requested',
          actor: 'Assigned resource',
          actions: ['Update', 'Resubmit'],
          colour: 'red'
        },
        {
          stage: 'Delivered',
          description: 'Deliverable complete',
          actor: 'None (complete)',
          actions: ['None'],
          colour: 'green'
        }
      ],
      tips: [
        'Include review criteria when defining deliverables',
        'Attach evidence for review (documents, links)',
        'Review comments guide rework'
      ]
    },
    
    certificate: {
      title: 'Milestone Certificate Workflow',
      description: 'Milestone certificates require customer sign-off for billing.',
      diagram: `
      ┌──────────┐    Request    ┌───────────┐    Sign    ┌────────┐
      │ Unsigned │ ─────────────>│ Requested │ ──────────>│ Signed │
      └──────────┘               └───────────┘            └────────┘
                                      │
                                      │ Decline
                                      v
                                ┌───────────┐
                                │ Declined  │
                                └───────────┘
      `,
      stages: [
        {
          stage: 'Unsigned',
          description: 'Certificate not yet requested',
          actor: 'Supplier PM',
          actions: ['Request Signature'],
          colour: 'grey'
        },
        {
          stage: 'Requested',
          description: 'Awaiting customer signature',
          actor: 'Customer PM',
          actions: ['Sign', 'Decline'],
          colour: 'amber'
        },
        {
          stage: 'Signed',
          description: 'Customer has signed off',
          actor: 'None (complete)',
          actions: ['None'],
          colour: 'green'
        },
        {
          stage: 'Declined',
          description: 'Signature declined',
          actor: 'Supplier PM',
          actions: ['Address Issues', 'Request Again'],
          colour: 'red'
        }
      ],
      tips: [
        'Ensure all deliverables are complete before requesting',
        'Certificate enables milestone invoicing',
        'Include supporting evidence with request'
      ]
    },
    
    partnerInvoice: {
      title: 'Partner Invoice Workflow',
      description: 'Partner invoices require approval before payment.',
      diagram: `
      ┌─────────┐    Submit    ┌───────────┐    Approve    ┌──────────┐    Pay    ┌────────┐
      │  Draft  │ ────────────>│ Submitted │ ─────────────>│ Approved │ ─────────>│  Paid  │
      └─────────┘              └───────────┘               └──────────┘           └────────┘
           ^                        │
           │        Reject          │
           └────────────────────────┘
      `,
      stages: [
        {
          stage: 'Draft',
          description: 'Invoice being created',
          actor: 'Partner Admin / Supplier PM',
          actions: ['Edit', 'Add Lines', 'Submit'],
          colour: 'grey'
        },
        {
          stage: 'Submitted',
          description: 'Awaiting approval',
          actor: 'Supplier PM / Admin',
          actions: ['Approve', 'Reject'],
          colour: 'blue'
        },
        {
          stage: 'Approved',
          description: 'Ready for payment',
          actor: 'Admin',
          actions: ['Record Payment'],
          colour: 'green'
        },
        {
          stage: 'Paid',
          description: 'Payment recorded',
          actor: 'None (complete)',
          actions: ['None'],
          colour: 'green'
        },
        {
          stage: 'Rejected',
          description: 'Returned for correction',
          actor: 'Partner Admin',
          actions: ['Edit', 'Resubmit'],
          colour: 'red'
        }
      ],
      tips: [
        'Attach original invoice document',
        'Match line items to approved work',
        'Check payment terms'
      ]
    }
  },
  
  notifications: {
    title: 'Workflow Notifications',
    description: 'The system sends notifications at key workflow points.',
    triggers: [
      { trigger: 'Item Submitted', recipients: 'Next stage actors', example: 'PM notified when timesheet submitted' },
      { trigger: 'Item Approved', recipients: 'Original submitter', example: 'Creator notified of approval' },
      { trigger: 'Item Rejected', recipients: 'Original submitter', example: 'Creator notified with rejection reason' },
      { trigger: 'Deadline Approaching', recipients: 'Pending actors', example: 'Reminder to approve before deadline' },
      { trigger: 'Item Overdue', recipients: 'Item owner and managers', example: 'Alert when approval is late' }
    ],
    tips: [
      'Configure notification preferences in Settings',
      'Critical notifications cannot be disabled',
      'Email digest consolidates multiple notifications'
    ]
  },
  
  faq: [
    {
      question: 'Why does my item need two approvals?',
      answer: 'Most workflows have two stages: Validation (Supplier PM confirms accuracy) and Approval (Customer PM authorises). This ensures both supplier and customer agree before items are finalised.'
    },
    {
      question: 'What happens when something is rejected?',
      answer: 'Rejected items return to Draft status with a rejection note explaining what needs to be fixed. Make corrections and resubmit to restart the workflow.'
    },
    {
      question: 'Can I skip a workflow stage?',
      answer: 'No, all stages must be completed in order. This ensures proper review and creates an audit trail. Admins cannot bypass workflow stages.'
    },
    {
      question: 'Who can approve my items?',
      answer: 'It depends on the stage. Supplier PM validates (first approval). Customer PM approves (final approval). Check the workflow diagram to see who acts at each stage.'
    },
    {
      question: 'How long should approval take?',
      answer: 'Target turnaround depends on your project settings. Typically: validation within 2-3 days, approval within 5 days. Overdue items show alerts.'
    },
    {
      question: 'Can I see where my item is in the workflow?',
      answer: 'Yes, every item shows its current status. Click on the item to see its full history including who took each action and when.'
    },
    {
      question: 'What if the approver is unavailable?',
      answer: 'Contact your Admin to either delegate approval or temporarily change permissions. Some systems allow delegation, but this must be configured.'
    },
    {
      question: 'Can workflows be customised?',
      answer: 'The basic workflow structure is fixed for consistency, but Admins can configure who acts at each stage and notification settings.'
    }
  ],
  
  related: ['timesheets', 'expenses', 'variations', 'deliverables', 'milestones', 'partner-invoices', 'roles-permissions']
};

export default workflowsGuide;
