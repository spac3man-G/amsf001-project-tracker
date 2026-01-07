// RAID Log Feature Guide
// Complete how-to documentation for Risks, Assumptions, Issues, and Dependencies

const raidGuide = {
  id: 'raid',
  title: 'RAID Log',
  category: 'project-management',
  description: 'The RAID Log tracks Risks, Assumptions, Issues, and Dependencies that could affect project success. It provides a centralised view of potential problems and their mitigation, helping project teams proactively manage uncertainty and maintain stakeholder awareness.',
  
  navigation: {
    path: '/raid',
    sidebar: 'Project → RAID Log',
    quickAccess: 'Dashboard → Active Risks widget, Dashboard → Open Issues widget',
    breadcrumb: 'Home > Project > RAID Log'
  },
  
  howTo: {
    createRisk: {
      title: 'Creating a Risk',
      steps: [
        'Navigate to the RAID Log page from the sidebar (Project → RAID Log)',
        'Click the "New Item" button and select "Risk"',
        'Enter a clear title describing the potential risk',
        'Provide a detailed description of what could happen',
        'Select the probability (likelihood) of occurrence',
        'Select the impact (severity) if the risk occurs',
        'Assign an owner responsible for monitoring this risk',
        'Add initial mitigation actions (what will reduce probability or impact)',
        'Click "Save" to create the risk'
      ],
      tips: [
        'Risks are potential future problems - they haven\'t happened yet',
        'Use the risk matrix to determine overall risk score',
        'Assign owners who can actually influence the risk',
        'Document mitigation actions, not just the risk itself',
        'Review risks regularly in status meetings'
      ],
      videoUrl: null
    },
    createIssue: {
      title: 'Creating an Issue',
      steps: [
        'Navigate to the RAID Log page',
        'Click the "New Item" button and select "Issue"',
        'Enter a clear title describing the problem',
        'Provide detailed description of the issue and its impact',
        'Select the priority level (Critical, High, Medium, Low)',
        'Assign an owner responsible for resolution',
        'Set a target resolution date',
        'Add any immediate actions being taken',
        'Click "Save" to create the issue'
      ],
      tips: [
        'Issues are current problems - they are happening now',
        'Be specific about the impact on the project',
        'Critical issues should be escalated immediately',
        'Track resolution actions and progress',
        'Convert resolved risks to issues if they materialise'
      ]
    },
    createAssumption: {
      title: 'Creating an Assumption',
      steps: [
        'Navigate to the RAID Log page',
        'Click the "New Item" button and select "Assumption"',
        'Enter a clear title stating the assumption',
        'Provide description explaining the assumption and why it matters',
        'Indicate the impact if this assumption proves false',
        'Assign an owner responsible for validating the assumption',
        'Set a validation date if applicable',
        'Click "Save" to create the assumption'
      ],
      tips: [
        'Assumptions are things we believe to be true but haven\'t verified',
        'Document why the assumption is being made',
        'Plan how and when to validate assumptions',
        'Invalid assumptions often become risks or issues',
        'Review assumptions when project context changes'
      ]
    },
    createDependency: {
      title: 'Creating a Dependency',
      steps: [
        'Navigate to the RAID Log page',
        'Click the "New Item" button and select "Dependency"',
        'Enter a clear title describing what the project depends on',
        'Provide description of the dependency and its importance',
        'Select whether it is internal or external',
        'Identify the dependent milestone or deliverable',
        'Set the required date (when the dependency must be resolved)',
        'Assign an owner to track the dependency',
        'Click "Save" to create the dependency'
      ],
      tips: [
        'Dependencies are things we need from others to proceed',
        'External dependencies are outside your organisation',
        'Internal dependencies are from other teams or projects',
        'Track dependencies that are on the critical path closely',
        'Escalate blocked dependencies promptly'
      ]
    },
    mitigate: {
      title: 'Adding Mitigation Actions',
      steps: [
        'Open the risk or issue you want to mitigate',
        'Click the "Actions" tab or section',
        'Click "Add Action" button',
        'Describe the mitigation action clearly',
        'Assign the action to a responsible person',
        'Set a due date for the action',
        'Save the action',
        'Update action status as progress is made'
      ],
      tips: [
        'Mitigation reduces probability (for risks) or impact',
        'Each action should be specific and achievable',
        'Assign actions to individuals, not teams',
        'Track completion of mitigation actions',
        'Multiple actions may be needed for significant risks'
      ]
    },
    updateStatus: {
      title: 'Updating RAID Item Status',
      steps: [
        'Open the RAID item you want to update',
        'Click on the Status field',
        'Select the new status from the dropdown',
        'Add a comment explaining the status change',
        'Save the changes'
      ],
      tips: [
        'Update status regularly to keep the log current',
        'Add comments to explain status changes',
        'Closed items are retained for historical reference',
        'Mitigated risks may still need monitoring'
      ]
    },
    close: {
      title: 'Closing a RAID Item',
      steps: [
        'Open the RAID item to close',
        'Ensure all actions are complete (for risks/issues)',
        'Click "Close" or change status to "Closed"',
        'Add closure notes explaining the resolution',
        'Confirm the closure',
        'The item moves to closed status but remains visible'
      ],
      tips: [
        'Close risks that are no longer relevant or fully mitigated',
        'Close issues when they are resolved',
        'Close assumptions when validated (true or false)',
        'Close dependencies when satisfied',
        'Document the outcome in closure notes'
      ]
    },
    view: {
      title: 'Viewing the RAID Log',
      steps: [
        'Navigate to the RAID Log page from the sidebar',
        'View all items in a unified list or switch to tabbed view by type',
        'Use the type filter to show only Risks, Issues, Assumptions, or Dependencies',
        'Use the status filter to show Open, In Progress, or Closed items',
        'Use the owner filter to see items assigned to specific people',
        'Click on any item to see full details',
        'Use the risk matrix view for visual risk assessment'
      ],
      tips: [
        'The dashboard shows high-priority items',
        'Export to CSV for reporting',
        'Use the matrix view to see risk distribution',
        'Filter by owner for individual accountability'
      ]
    }
  },
  
  fields: {
    common: {
      title: {
        name: 'Title',
        label: 'Title',
        required: true,
        type: 'text',
        description: 'A clear, concise title for the item',
        validation: 'Required. Maximum 200 characters.',
        tips: 'Make titles descriptive and scannable.'
      },
      description: {
        name: 'Description',
        label: 'Description',
        required: true,
        type: 'textarea',
        description: 'Detailed description of the item',
        validation: 'Required. Maximum 2000 characters.',
        tips: 'Include context, background, and potential impact.'
      },
      type: {
        name: 'Type',
        label: 'Item Type',
        required: true,
        type: 'select',
        description: 'The category of RAID item',
        values: ['Risk', 'Assumption', 'Issue', 'Dependency'],
        tips: 'Choose the type that best describes the item.'
      },
      owner_id: {
        name: 'Owner',
        label: 'Owner',
        required: true,
        type: 'select',
        description: 'Person responsible for managing this item',
        tips: 'Assign to someone who can take action on it.'
      },
      status: {
        name: 'Status',
        label: 'Status',
        required: true,
        type: 'select',
        description: 'Current status of the item',
        values: ['Open', 'In Progress', 'Mitigated', 'Resolved', 'Closed'],
        tips: 'Keep status updated to reflect current state.'
      }
    },
    risk: {
      probability: {
        name: 'Probability',
        label: 'Probability',
        required: true,
        type: 'select',
        description: 'Likelihood of the risk occurring',
        values: ['Very Low', 'Low', 'Medium', 'High', 'Very High'],
        scores: { 'Very Low': 1, 'Low': 2, 'Medium': 3, 'High': 4, 'Very High': 5 },
        tips: 'Estimate based on available evidence and experience.'
      },
      impact: {
        name: 'Impact',
        label: 'Impact',
        required: true,
        type: 'select',
        description: 'Severity of consequences if risk occurs',
        values: ['Very Low', 'Low', 'Medium', 'High', 'Very High'],
        scores: { 'Very Low': 1, 'Low': 2, 'Medium': 3, 'High': 4, 'Very High': 5 },
        tips: 'Consider impact on cost, timeline, quality, and scope.'
      },
      risk_score: {
        name: 'Risk Score',
        label: 'Risk Score',
        required: false,
        type: 'calculated',
        description: 'Calculated as Probability × Impact',
        tips: 'Higher scores indicate higher priority risks.'
      },
      mitigation: {
        name: 'Mitigation',
        label: 'Mitigation Strategy',
        required: false,
        type: 'textarea',
        description: 'Actions to reduce probability or impact',
        tips: 'Document what will be done to address the risk.'
      }
    },
    issue: {
      priority: {
        name: 'Priority',
        label: 'Priority',
        required: true,
        type: 'select',
        description: 'Urgency of resolving this issue',
        values: ['Critical', 'High', 'Medium', 'Low'],
        tips: 'Critical issues need immediate attention.'
      },
      impact_description: {
        name: 'Impact Description',
        label: 'Impact',
        required: true,
        type: 'textarea',
        description: 'How this issue is affecting the project',
        tips: 'Be specific about cost, timeline, or quality impacts.'
      },
      resolution: {
        name: 'Resolution',
        label: 'Resolution',
        required: false,
        type: 'textarea',
        description: 'How the issue was or will be resolved',
        tips: 'Document the resolution approach and outcome.'
      },
      target_date: {
        name: 'Target Date',
        label: 'Target Resolution Date',
        required: false,
        type: 'date',
        description: 'When the issue should be resolved',
        tips: 'Set realistic targets based on complexity.'
      }
    },
    assumption: {
      validation_status: {
        name: 'Validation Status',
        label: 'Validated',
        required: false,
        type: 'select',
        description: 'Whether the assumption has been verified',
        values: ['Not Validated', 'Validated True', 'Validated False'],
        tips: 'Update as you confirm or disprove assumptions.'
      },
      if_false_impact: {
        name: 'If False Impact',
        label: 'Impact if False',
        required: false,
        type: 'textarea',
        description: 'Consequences if assumption proves incorrect',
        tips: 'Document the fallback plan or risk if false.'
      },
      validation_date: {
        name: 'Validation Date',
        label: 'Validation Date',
        required: false,
        type: 'date',
        description: 'When the assumption should be validated',
        tips: 'Plan validation before dependent decisions.'
      }
    },
    dependency: {
      dependency_type: {
        name: 'Dependency Type',
        label: 'Type',
        required: true,
        type: 'select',
        description: 'Whether the dependency is internal or external',
        values: ['Internal', 'External'],
        tips: 'External dependencies are outside your control.'
      },
      dependent_item: {
        name: 'Dependent Item',
        label: 'Dependent On',
        required: false,
        type: 'text',
        description: 'What the project is waiting for',
        tips: 'Be specific about what is needed and from whom.'
      },
      required_date: {
        name: 'Required Date',
        label: 'Required By',
        required: true,
        type: 'date',
        description: 'When the dependency must be satisfied',
        tips: 'Set based on project schedule needs.'
      },
      linked_milestone: {
        name: 'Linked Milestone',
        label: 'Affects Milestone',
        required: false,
        type: 'select',
        description: 'Which milestone this dependency affects',
        tips: 'Link to show schedule impact.'
      }
    }
  },
  
  riskMatrix: {
    title: 'Risk Assessment Matrix',
    description: 'Risks are scored by multiplying Probability × Impact to determine overall risk level and priority.',
    diagram: `
                                    IMPACT
                    Very Low   Low    Medium   High   Very High
                       (1)     (2)      (3)    (4)      (5)
                  ┌────────┬────────┬────────┬────────┬────────┐
    Very High (5) │   5    │   10   │   15   │   20   │   25   │
                  │  Low   │  Med   │  High  │ V.High │ V.High │
                  ├────────┼────────┼────────┼────────┼────────┤
    High (4)      │   4    │   8    │   12   │   16   │   20   │
                  │  Low   │  Med   │  High  │ V.High │ V.High │
    P             ├────────┼────────┼────────┼────────┼────────┤
    R  Medium (3) │   3    │   6    │   9    │   12   │   15   │
    O             │  Low   │  Low   │  Med   │  High  │  High  │
    B             ├────────┼────────┼────────┼────────┼────────┤
    A  Low (2)    │   2    │   4    │   6    │   8    │   10   │
    B             │  Low   │  Low   │  Low   │  Med   │  Med   │
    I             ├────────┼────────┼────────┼────────┼────────┤
    L  Very Low(1)│   1    │   2    │   3    │   4    │   5    │
    I             │  Low   │  Low   │  Low   │  Low   │  Low   │
    T             └────────┴────────┴────────┴────────┴────────┘
    Y
    `,
    levels: [
      {
        name: 'Very High Risk',
        scoreRange: '16-25',
        colour: 'red',
        action: 'Immediate attention required. Escalate to senior management. Active mitigation mandatory.'
      },
      {
        name: 'High Risk',
        scoreRange: '10-15',
        colour: 'orange',
        action: 'Priority attention. Mitigation plan required. Regular monitoring.'
      },
      {
        name: 'Medium Risk',
        scoreRange: '5-9',
        colour: 'amber',
        action: 'Monitor regularly. Mitigation recommended. Review in status meetings.'
      },
      {
        name: 'Low Risk',
        scoreRange: '1-4',
        colour: 'green',
        action: 'Accept or monitor. Mitigation optional. Periodic review.'
      }
    ],
    guidance: [
      'Score = Probability × Impact',
      'Update scores as circumstances change',
      'Focus mitigation efforts on highest scores first',
      'Very High risks should have documented mitigation plans',
      'Review all High and Very High risks weekly'
    ]
  },
  
  workflow: {
    title: 'RAID Item Workflow',
    description: 'RAID items progress through statuses as they are managed and resolved.',
    diagram: `
    ┌────────┐    Work Started    ┌─────────────┐    Addressed    ┌───────────────┐
    │  Open  │ ─────────────────> │ In Progress │ ──────────────> │ Mitigated/    │
    └────────┘                    └─────────────┘                 │ Resolved      │
                                                                  └───────────────┘
                                                                         │
                                                                         │ Complete
                                                                         ▼
                                                                    ┌────────┐
                                                                    │ Closed │
                                                                    └────────┘
    `,
    statuses: [
      { 
        name: 'Open', 
        description: 'Item identified and logged, not yet being addressed',
        colour: 'blue',
        applicableTo: ['Risk', 'Assumption', 'Issue', 'Dependency']
      },
      { 
        name: 'In Progress', 
        description: 'Active work underway to address the item',
        colour: 'amber',
        applicableTo: ['Risk', 'Assumption', 'Issue', 'Dependency']
      },
      { 
        name: 'Mitigated', 
        description: 'Risk has been reduced but still requires monitoring',
        colour: 'teal',
        applicableTo: ['Risk']
      },
      { 
        name: 'Resolved', 
        description: 'Issue resolved, assumption validated, or dependency satisfied',
        colour: 'green',
        applicableTo: ['Assumption', 'Issue', 'Dependency']
      },
      { 
        name: 'Closed', 
        description: 'Item fully addressed and no longer active',
        colour: 'grey',
        applicableTo: ['Risk', 'Assumption', 'Issue', 'Dependency']
      }
    ],
    transitions: [
      { 
        from: 'Open', 
        to: 'In Progress', 
        action: 'Start Work', 
        actor: 'Owner or PM',
        description: 'Begin addressing the item'
      },
      { 
        from: 'In Progress', 
        to: 'Mitigated', 
        action: 'Mitigate', 
        actor: 'Owner or PM',
        description: 'Risk reduced but still monitored (risks only)'
      },
      { 
        from: 'In Progress', 
        to: 'Resolved', 
        action: 'Resolve', 
        actor: 'Owner or PM',
        description: 'Issue fixed, assumption validated, or dependency met'
      },
      { 
        from: 'Mitigated', 
        to: 'Closed', 
        action: 'Close', 
        actor: 'Owner or PM',
        description: 'Risk no longer relevant'
      },
      { 
        from: 'Resolved', 
        to: 'Closed', 
        action: 'Close', 
        actor: 'Owner or PM',
        description: 'Final closure of resolved item'
      },
      { 
        from: 'Open', 
        to: 'Closed', 
        action: 'Close', 
        actor: 'Owner or PM',
        description: 'Close without action (no longer relevant)'
      }
    ]
  },
  
  permissions: {
    contributor: {
      role: 'Contributor',
      canView: 'All RAID items',
      canCreate: true,
      canEdit: 'Own items only',
      canDelete: false,
      canClose: 'Own items only',
      canAssign: false,
      notes: 'Contributors can raise and manage their own RAID items'
    },
    supplier_pm: {
      role: 'Supplier PM',
      canView: 'All RAID items',
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canClose: true,
      canAssign: true,
      notes: 'Supplier PMs manage the RAID log for the project'
    },
    customer_pm: {
      role: 'Customer PM',
      canView: 'All RAID items',
      canCreate: true,
      canEdit: true,
      canDelete: false,
      canClose: true,
      canAssign: true,
      notes: 'Customer PMs can raise and manage RAID items'
    },
    admin: {
      role: 'Admin',
      canView: 'All RAID items',
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canClose: true,
      canAssign: true,
      notes: 'Admins have full access to RAID management'
    },
    partner_admin: {
      role: 'Partner Admin',
      canView: 'All RAID items',
      canCreate: true,
      canEdit: 'Own items only',
      canDelete: false,
      canClose: 'Own items only',
      canAssign: false,
      notes: 'Partner Admins can raise RAID items affecting their team'
    },
    partner_user: {
      role: 'Partner User',
      canView: 'All RAID items',
      canCreate: true,
      canEdit: 'Own items only',
      canDelete: false,
      canClose: 'Own items only',
      canAssign: false,
      notes: 'Partner Users can raise RAID items they identify'
    }
  },
  
  faq: [
    {
      question: 'What is the difference between a Risk and an Issue?',
      answer: 'A Risk is a potential future problem - something that might happen. An Issue is a current problem - something that has already happened and is affecting the project now. Risks require mitigation to prevent occurrence; issues require resolution to fix the problem.'
    },
    {
      question: 'How do I determine the risk score?',
      answer: 'Risk score is calculated as Probability × Impact. Both are rated 1-5 (Very Low to Very High). For example, a High probability (4) risk with Medium impact (3) scores 12 (High risk). Use the risk matrix to visualise and prioritise risks.'
    },
    {
      question: 'When should I convert a Risk to an Issue?',
      answer: 'Convert a Risk to an Issue when the risk event occurs - when the potential problem becomes an actual problem. Create a new Issue referencing the original Risk, then close the Risk as "Occurred" or "Closed".'
    },
    {
      question: 'What is an Assumption?',
      answer: 'An Assumption is something believed to be true but not yet verified. For example, "The API will be available by March" or "Users have Chrome browsers". Track assumptions and validate them to avoid surprises later.'
    },
    {
      question: 'What happens if an Assumption proves false?',
      answer: 'If an Assumption is validated as false, it typically becomes a Risk or Issue. Document the impact, create appropriate RAID items, and update project plans. The original Assumption should be marked "Validated False" and closed.'
    },
    {
      question: 'How do I prioritise Issues?',
      answer: 'Use the Priority field: Critical (blocking progress, immediate action), High (significant impact, urgent), Medium (moderate impact, planned response), Low (minor impact, address when convenient). Critical issues should be escalated immediately.'
    },
    {
      question: 'What is the difference between Internal and External Dependencies?',
      answer: 'Internal Dependencies are on other teams, projects, or resources within your organisation. External Dependencies are on third parties, vendors, clients, or external factors outside your organisation. External dependencies are typically harder to influence.'
    },
    {
      question: 'Who should own a RAID item?',
      answer: 'The Owner should be someone who can take action to address the item. For risks, someone who can implement mitigation. For issues, someone who can drive resolution. For dependencies, someone who can chase the dependent party.'
    },
    {
      question: 'How often should RAID items be reviewed?',
      answer: 'High and Very High risks should be reviewed weekly. Medium risks at least fortnightly. Critical issues should be reviewed daily until resolved. Include RAID review as a standing agenda item in project status meetings.'
    },
    {
      question: 'Can I close a RAID item and reopen it later?',
      answer: 'Items cannot be directly reopened. If a closed risk materialises or a resolved issue recurs, create a new RAID item referencing the original. This maintains audit history while addressing the new occurrence.'
    },
    {
      question: 'What mitigation strategies can I use for risks?',
      answer: 'Common strategies: Avoid (eliminate the risk), Mitigate (reduce probability or impact), Transfer (share risk with another party), Accept (acknowledge and monitor). Document your chosen strategy and specific actions.'
    },
    {
      question: 'How do Dependencies differ from Risks?',
      answer: 'Dependencies are things you need from others to proceed - they are known requirements. Risks are potential problems that might occur. A delayed dependency might become a risk (if it might be late) or an issue (if it is actually late).'
    }
  ],
  
  related: ['milestones', 'deliverables', 'variations', 'workflows', 'project-settings']
};

export default raidGuide;
