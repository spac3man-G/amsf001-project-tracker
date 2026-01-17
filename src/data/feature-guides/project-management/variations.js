// Variation Feature Guide
// Complete how-to documentation for change request/variation functionality

const variationsGuide = {
  id: 'variations',
  title: 'Variations',
  category: 'project-management',
  description: 'Variations are formal change requests that modify the project scope, timeline, or budget. They provide an auditable trail of approved changes and protect the project baseline. Variations require customer approval before implementation and can affect milestones, deliverables, and overall project costs.',
  
  navigation: {
    path: '/variations',
    sidebar: 'Project → Variations',
    quickAccess: 'Dashboard → Pending Variations widget, or from Milestone details',
    breadcrumb: 'Home > Project > Variations'
  },
  
  howTo: {
    create: {
      title: 'Creating a Variation Request',
      steps: [
        'Navigate to the Variations page from the sidebar (Project → Variations)',
        'Click the "New Variation" button in the top right corner',
        'Enter a clear, descriptive title for the change',
        'Select the variation type (Scope, Timeline, Budget, or Combined)',
        'Provide a detailed description of the proposed change',
        'Enter the business justification explaining why this change is needed',
        'Link to affected milestones and/or deliverables',
        'Click "Save as Draft" to continue editing, or proceed to impact assessment'
      ],
      tips: [
        'Be specific in the title - it appears in approval notifications',
        'Choose the type that best represents the primary change',
        'Use "Combined" for changes affecting multiple areas',
        'Link all affected items for complete traceability',
        'Draft variations can be edited before submission'
      ],
      videoUrl: null
    },
    assessImpact: {
      title: 'Assessing Variation Impact',
      steps: [
        'Open the variation in draft status',
        'Click the "Impact Assessment" tab or section',
        '(Recommended) Review the AI Impact Analysis panel for automated analysis',
        'For cost impact: enter the additional budget required (positive) or savings (negative)',
        'For timeline impact: enter days added (positive) or saved (negative)',
        'For scope impact: describe what is being added, changed, or removed',
        'Add any risk implications of the change',
        'Review the total impact summary',
        'Save the impact assessment'
      ],
      tips: [
        'Be realistic with impact estimates - they set expectations',
        'Include all direct and indirect costs',
        'Consider resource availability when estimating timeline',
        'Document assumptions behind your estimates',
        'Impact assessment is required before submission',
        'Use AI Impact Analysis to identify dependencies you might have missed'
      ]
    },
    useAIImpactAnalysis: {
      title: 'Using AI Impact Analysis',
      steps: [
        'Open the variation detail page',
        'Look for the "AI Impact Analysis" panel (with sparkles icon)',
        'The analysis automatically evaluates: timeline impact, budget implications, scope changes, and dependencies',
        'Review the overall impact assessment (minimal, moderate, significant, major)',
        'Check the timeline section for affected milestones and predicted delays',
        'Review the budget section for cost breakdown and variance',
        'Check the dependencies section for downstream effects on other items',
        'Review the AI recommendation (approve, approve with conditions, needs review, or reject)',
        'Use the analysis to inform your impact assessment and decision'
      ],
      tips: [
        'AI analysis considers all linked milestones and deliverables',
        'The timeline predictions are based on current project velocity',
        'Budget estimates include resource costs and historical patterns',
        'Dependencies show items that may need adjustment if the variation is approved',
        'AI recommendations are advisory - always apply business context',
        'Click refresh to update the analysis after making changes',
        'Conditions in "approve with conditions" identify specific items to address'
      ]
    },
    submit: {
      title: 'Submitting a Variation for Approval',
      steps: [
        'Ensure the variation has complete description and justification',
        'Complete the impact assessment',
        'Review all linked milestones and deliverables',
        'Click "Submit for Approval" button',
        'Add any additional notes for approvers (optional)',
        'Confirm the submission',
        'The variation moves to "Submitted" status',
        'Customer PM receives notification for review'
      ],
      tips: [
        'Submitted variations cannot be edited',
        'Ensure all stakeholders are aware before submitting',
        'The Customer PM will review and decide',
        'You can withdraw a submitted variation if needed'
      ]
    },
    review: {
      title: 'Reviewing a Variation (Customer PM)',
      steps: [
        'You will receive a notification when a variation is submitted',
        'Navigate to the Variations page or click the notification link',
        'Open the variation to review details',
        'Review the description, justification, and impact assessment',
        'Check the linked milestones and deliverables',
        'Consider the cost and timeline implications',
        'Click "Approve" to accept, or "Reject" to decline',
        'Add comments explaining your decision'
      ],
      tips: [
        'Take time to understand the full impact',
        'Consult with stakeholders if needed',
        'Approval authorises the supplier to implement the change',
        'Rejected variations can be revised and resubmitted'
      ]
    },
    approve: {
      title: 'Approving a Variation (Customer PM)',
      steps: [
        'Open the variation in "Submitted" or "Under Review" status',
        'Review all details and impact assessment',
        'Click the "Approve" button',
        'Add approval comments (optional but recommended)',
        'Confirm the approval',
        'The variation moves to "Approved" status',
        'The supplier is notified and can begin implementation'
      ],
      tips: [
        'Approval commits to the cost and timeline changes',
        'Approved variations update the project baseline',
        'The billing amount may be adjusted based on cost impact',
        'Document the approval rationale in comments'
      ]
    },
    reject: {
      title: 'Rejecting a Variation (Customer PM)',
      steps: [
        'Open the variation in "Submitted" or "Under Review" status',
        'Review the details to understand what is being proposed',
        'Click the "Reject" button',
        'Enter rejection notes explaining why (required)',
        'Suggest alternatives or modifications if applicable',
        'Confirm the rejection',
        'The variation moves to "Rejected" status',
        'The supplier is notified with your feedback'
      ],
      tips: [
        'Always provide clear rejection reasons',
        'Suggest how the request could be modified for approval',
        'Rejected variations can be revised and resubmitted',
        'Consider partial approval if some elements are acceptable'
      ]
    },
    implement: {
      title: 'Implementing an Approved Variation',
      steps: [
        'Open the approved variation',
        'Review the approved scope, timeline, and cost changes',
        'Make the necessary changes to milestones and deliverables',
        'Update dates and budgets as specified',
        'Create or modify work items as needed',
        'Once all changes are made, click "Mark as Implemented"',
        'Add implementation notes describing what was done',
        'The variation moves to "Implemented" status'
      ],
      tips: [
        'Only implement after formal approval',
        'Update all linked items as specified',
        'Document any deviations from the approved plan',
        'Implementation marks the variation as complete'
      ]
    },
    view: {
      title: 'Viewing Variations',
      steps: [
        'Navigate to the Variations page from the sidebar',
        'View the list showing title, type, status, and impact summary',
        'Use filters to show specific statuses or types',
        'Use the date range filter to see variations from a period',
        'Click on any variation to see full details',
        'View the history tab to see status changes and comments'
      ],
      tips: [
        'Filter by status to see pending approvals',
        'The impact column shows cost/time changes at a glance',
        'Export to CSV for change log reporting',
        'Dashboard widget shows variations needing attention'
      ]
    },
    withdraw: {
      title: 'Withdrawing a Submitted Variation',
      steps: [
        'Open the variation in "Submitted" status',
        'Click the "Withdraw" button',
        'Enter a reason for withdrawal',
        'Confirm the withdrawal',
        'The variation returns to "Draft" status',
        'You can edit and resubmit, or delete the variation'
      ],
      tips: [
        'Withdraw if you need to make changes after submission',
        'Withdrawal notifies the Customer PM',
        'Use this if circumstances have changed',
        'Consider discussing with the customer before withdrawing'
      ]
    }
  },
  
  fields: {
    title: {
      name: 'Title',
      label: 'Variation Title',
      required: true,
      type: 'text',
      description: 'A clear, concise title describing the change',
      validation: 'Required. Maximum 200 characters.',
      tips: 'Be specific - "Add authentication module" is better than "Scope change".'
    },
    type: {
      name: 'Type',
      label: 'Variation Type',
      required: true,
      type: 'select',
      description: 'The primary category of change being requested',
      values: ['Scope Change', 'Timeline Change', 'Budget Change', 'Combined'],
      tips: 'Choose the type that best represents the primary impact.'
    },
    description: {
      name: 'Description',
      label: 'Description',
      required: true,
      type: 'textarea',
      description: 'Detailed description of what is being changed',
      validation: 'Required. Maximum 5000 characters.',
      tips: 'Include what is changing, why, and how it affects the project.'
    },
    justification: {
      name: 'Justification',
      label: 'Business Justification',
      required: true,
      type: 'textarea',
      description: 'The business reason for requesting this change',
      validation: 'Required. Maximum 2000 characters.',
      tips: 'Explain the business value or necessity of this change.'
    },
    cost_impact: {
      name: 'Cost Impact',
      label: 'Cost Impact',
      required: false,
      type: 'currency',
      description: 'The additional cost (positive) or saving (negative) of this change',
      tips: 'Enter the net change to project budget. Positive = additional cost.'
    },
    timeline_impact: {
      name: 'Timeline Impact',
      label: 'Timeline Impact (Days)',
      required: false,
      type: 'number',
      description: 'Days added (positive) or saved (negative) to the schedule',
      tips: 'Enter the net change to project timeline. Positive = longer timeline.'
    },
    scope_impact: {
      name: 'Scope Impact',
      label: 'Scope Impact Description',
      required: false,
      type: 'textarea',
      description: 'Description of what scope is being added, changed, or removed',
      tips: 'Be specific about deliverables and requirements affected.'
    },
    status: {
      name: 'Status',
      label: 'Status',
      required: true,
      type: 'select',
      description: 'Current status in the approval workflow',
      values: ['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected', 'Implemented', 'Withdrawn'],
      tips: 'Status changes as the variation moves through approval.'
    },
    linked_milestones: {
      name: 'Linked Milestones',
      label: 'Affected Milestones',
      required: false,
      type: 'multiselect',
      description: 'Milestones that will be affected by this change',
      tips: 'Link all milestones that need to be updated if approved.'
    },
    linked_deliverables: {
      name: 'Linked Deliverables',
      label: 'Affected Deliverables',
      required: false,
      type: 'multiselect',
      description: 'Deliverables that will be affected by this change',
      tips: 'Link specific deliverables being added, changed, or removed.'
    }
  },
  
  types: {
    scopeChange: {
      name: 'Scope Change',
      description: 'Changes to what is being delivered - adding, removing, or modifying requirements and deliverables',
      examples: [
        'Adding a new feature or module',
        'Removing functionality from the original scope',
        'Changing requirements or acceptance criteria',
        'Adding or removing deliverables'
      ],
      typicalImpact: 'Often has cost and timeline implications as well',
      whenToUse: 'Primary change is to what is being built'
    },
    timelineChange: {
      name: 'Timeline Change',
      description: 'Changes to project dates without changing scope or budget',
      examples: [
        'Extending a milestone end date',
        'Accelerating delivery schedule',
        'Adjusting phase boundaries',
        'Responding to external delays'
      ],
      typicalImpact: 'May not affect cost if resources are maintained',
      whenToUse: 'Dates need to change but scope remains the same'
    },
    budgetChange: {
      name: 'Budget Change',
      description: 'Changes to project costs without changing scope or timeline',
      examples: [
        'Rate changes for existing resources',
        'Additional budget for contingency',
        'Cost savings from efficiency improvements',
        'Currency fluctuation adjustments'
      ],
      typicalImpact: 'Changes billing and margin calculations',
      whenToUse: 'Cost changes without scope or schedule impact'
    },
    combined: {
      name: 'Combined',
      description: 'Changes affecting multiple areas - scope, timeline, and/or budget together',
      examples: [
        'New feature requiring extra time and budget',
        'Accelerated delivery with additional resources',
        'Major re-scoping of project direction',
        'Contract renegotiation'
      ],
      typicalImpact: 'Affects multiple project dimensions',
      whenToUse: 'Change affects two or more of scope, timeline, budget'
    }
  },
  
  workflow: {
    title: 'Variation Approval Workflow',
    description: 'Variations follow a formal approval process to ensure changes are properly authorised before implementation.',
    diagram: `
    ┌─────────┐    Submit    ┌───────────┐    Review    ┌──────────────┐
    │  Draft  │ ───────────> │ Submitted │ ──────────> │ Under Review │
    └─────────┘              └───────────┘             └──────────────┘
         ^                        │                          │
         │ Withdraw               │                    ┌─────┴─────┐
         └────────────────────────┘                    │           │
                                                       ▼           ▼
                                                 ┌──────────┐ ┌──────────┐
                                                 │ Approved │ │ Rejected │
                                                 └──────────┘ └──────────┘
                                                       │           │
                                                       │ Implement │ Revise & Resubmit
                                                       ▼           │
                                                 ┌─────────────┐   │
                                                 │ Implemented │   │
                                                 └─────────────┘   │
                                                                   └──> Draft
    `,
    statuses: [
      { 
        name: 'Draft', 
        description: 'Variation created and being prepared. Can be edited.',
        colour: 'grey'
      },
      { 
        name: 'Submitted', 
        description: 'Variation submitted for customer review.',
        colour: 'blue'
      },
      { 
        name: 'Under Review', 
        description: 'Customer PM is actively reviewing the variation.',
        colour: 'amber'
      },
      { 
        name: 'Approved', 
        description: 'Customer has approved the change. Ready for implementation.',
        colour: 'green'
      },
      { 
        name: 'Rejected', 
        description: 'Customer has declined the change request.',
        colour: 'red'
      },
      { 
        name: 'Implemented', 
        description: 'Approved changes have been applied to the project.',
        colour: 'teal'
      },
      { 
        name: 'Withdrawn', 
        description: 'Supplier withdrew the variation before approval.',
        colour: 'grey'
      }
    ],
    transitions: [
      { 
        from: 'Draft', 
        to: 'Submitted', 
        action: 'Submit', 
        actor: 'Supplier PM or Admin',
        description: 'Submit variation for customer approval'
      },
      { 
        from: 'Submitted', 
        to: 'Under Review', 
        action: 'Start Review', 
        actor: 'Customer PM',
        description: 'Begin formal review of the variation'
      },
      { 
        from: 'Submitted', 
        to: 'Draft', 
        action: 'Withdraw', 
        actor: 'Supplier PM or Admin',
        description: 'Withdraw submitted variation for revision'
      },
      { 
        from: 'Under Review', 
        to: 'Approved', 
        action: 'Approve', 
        actor: 'Customer PM',
        description: 'Approve the change request'
      },
      { 
        from: 'Under Review', 
        to: 'Rejected', 
        action: 'Reject', 
        actor: 'Customer PM',
        description: 'Reject the change request'
      },
      { 
        from: 'Approved', 
        to: 'Implemented', 
        action: 'Mark Implemented', 
        actor: 'Supplier PM or Admin',
        description: 'Confirm changes have been applied'
      },
      { 
        from: 'Rejected', 
        to: 'Draft', 
        action: 'Revise', 
        actor: 'Supplier PM or Admin',
        description: 'Revise and prepare for resubmission'
      }
    ]
  },
  
  businessRules: {
    approvalThresholds: {
      title: 'Approval Authority',
      description: 'All variations require Customer PM approval regardless of value. For variations exceeding certain thresholds, additional approvals may be required outside the system.',
      rules: [
        'All variations require Customer PM approval',
        'High-value variations (>10% of project budget) may need executive approval',
        'Timeline extensions beyond 20% may require contract review',
        'The system tracks all approvals for audit purposes'
      ]
    },
    requiredFields: {
      title: 'Required Information',
      description: 'Certain fields must be completed before a variation can be submitted.',
      rules: [
        'Title, description, and justification are always required',
        'At least one impact field (cost, timeline, or scope) must be completed',
        'At least one milestone or deliverable should be linked',
        'Impact assessment must be reviewed and confirmed'
      ]
    },
    baselineProtection: {
      title: 'Baseline Protection',
      description: 'Variations maintain baseline integrity by documenting all changes.',
      rules: [
        'Original baseline values are preserved',
        'Approved variations create a new baseline version',
        'All changes are traceable to specific variations',
        'Budget and timeline changes update project totals only after implementation'
      ]
    }
  },
  
  permissions: {
    contributor: {
      role: 'Contributor',
      canView: 'All variations (read-only)',
      canCreate: false,
      canEdit: false,
      canSubmit: false,
      canApprove: false,
      canReject: false,
      canImplement: false,
      notes: 'Contributors can view variations for awareness'
    },
    supplier_pm: {
      role: 'Supplier PM',
      canView: 'All variations',
      canCreate: true,
      canEdit: 'Draft variations',
      canSubmit: true,
      canWithdraw: true,
      canApprove: false,
      canReject: false,
      canImplement: true,
      notes: 'Supplier PMs create and manage variations, implement after approval'
    },
    customer_pm: {
      role: 'Customer PM',
      canView: 'All variations',
      canCreate: false,
      canEdit: false,
      canSubmit: false,
      canApprove: true,
      canReject: true,
      canImplement: false,
      notes: 'Customer PMs review and approve/reject variations'
    },
    admin: {
      role: 'Admin',
      canView: 'All variations',
      canCreate: true,
      canEdit: 'All draft variations',
      canSubmit: true,
      canWithdraw: true,
      canApprove: true,
      canReject: true,
      canImplement: true,
      notes: 'Admins have full access to variation management'
    },
    partner_admin: {
      role: 'Partner Admin',
      canView: 'All variations (read-only)',
      canCreate: false,
      canEdit: false,
      canSubmit: false,
      canApprove: false,
      canReject: false,
      canImplement: false,
      notes: 'Partner Admins can view variations for awareness'
    },
    partner_user: {
      role: 'Partner User',
      canView: 'All variations (read-only)',
      canCreate: false,
      canEdit: false,
      canSubmit: false,
      canApprove: false,
      canReject: false,
      canImplement: false,
      notes: 'Partner Users can view variations for awareness'
    }
  },
  
  faq: [
    {
      question: 'What is a variation?',
      answer: 'A variation is a formal change request that modifies the agreed project scope, timeline, or budget. It provides an auditable trail of approved changes and ensures all parties agree before changes are implemented.'
    },
    {
      question: 'When should I create a variation?',
      answer: 'Create a variation when the customer requests new features, when issues require scope changes, when timelines need to shift, or when costs will exceed the agreed budget. Any change to the baselined plan should have a variation.'
    },
    {
      question: 'What is the difference between variation types?',
      answer: 'Scope Change affects what is delivered. Timeline Change affects when it is delivered. Budget Change affects costs without scope/time changes. Combined is for changes affecting multiple areas. Choose the type that represents the primary change.'
    },
    {
      question: 'How do I calculate cost impact?',
      answer: 'Estimate the additional effort in days, multiply by day rates, and add any other costs (expenses, tools, etc.). For savings, enter a negative number. Include direct and indirect costs in your estimate.'
    },
    {
      question: 'Can I edit a submitted variation?',
      answer: 'No, submitted variations cannot be edited. If you need to make changes, withdraw the variation (returns it to Draft), make your edits, then resubmit.'
    },
    {
      question: 'What happens when a variation is approved?',
      answer: 'Approved variations authorise the supplier to implement the change. The project baseline is updated to reflect the new scope, timeline, or budget. Billing amounts may be adjusted based on the approved cost impact.'
    },
    {
      question: 'What happens when a variation is rejected?',
      answer: 'Rejected variations are not implemented. You can view the rejection notes to understand why, revise the variation based on feedback, and resubmit if appropriate. Some variations may not be resubmitted.'
    },
    {
      question: 'How does a variation affect the baseline?',
      answer: 'The original baseline is preserved for reference. When a variation is implemented, a new baseline version is created incorporating the approved changes. This maintains full traceability of how the project evolved.'
    },
    {
      question: 'Can I link a variation to multiple milestones?',
      answer: 'Yes, link all milestones and deliverables that will be affected by the change. This provides complete traceability and helps reviewers understand the full impact.'
    },
    {
      question: 'Who can approve variations?',
      answer: 'Only Customer PMs and Admins can approve or reject variations. Supplier PMs create and submit variations but cannot approve their own requests - this separation ensures proper governance.'
    },
    {
      question: 'How do I implement an approved variation?',
      answer: 'After approval, update the affected milestones and deliverables as specified in the variation. Adjust dates, budgets, and scope as approved. Then mark the variation as "Implemented" to complete the process.'
    },
    {
      question: 'What is the difference between withdrawing and rejecting?',
      answer: 'Withdrawal is done by the supplier before the customer decides - it returns the variation to draft for revision. Rejection is the customer\'s decision to decline the change request after review.'
    },
    {
      question: 'What is the AI Impact Analysis?',
      answer: 'AI Impact Analysis automatically evaluates the effects of a proposed variation on timeline, budget, scope, and dependencies. It identifies affected milestones, predicts delays, estimates costs, and provides a recommendation (approve, approve with conditions, needs review, or reject). It helps ensure all impacts are considered before approval.'
    },
    {
      question: 'How accurate is the AI impact prediction?',
      answer: 'AI predictions are based on current project data, historical patterns, and linked items. They are estimates intended as a starting point for your own assessment. Always apply your knowledge of the project context - the AI cannot account for all factors. Use it as a tool, not a final answer.'
    },
    {
      question: 'What does "approve with conditions" mean?',
      answer: 'When the AI recommends "approve with conditions", it has identified specific items that should be addressed before or during implementation. These might include resource availability issues, dependency conflicts, or risk mitigations. Review the conditions and decide if they can be satisfied.'
    }
  ],
  
  related: ['milestones', 'deliverables', 'billing', 'workflows', 'project-settings', 'ai-intelligence']
};

export default variationsGuide;
