// Quality Standards Feature Guide
// Complete how-to documentation for quality and compliance tracking

const qualityStandardsGuide = {
  id: 'quality-standards',
  title: 'Quality Standards',
  category: 'project-management',
  description: 'Quality Standards track compliance with industry standards, organisational policies, and project-specific requirements. The system enables assessment of compliance status, evidence collection, and reporting for audits and governance purposes.',
  
  navigation: {
    path: '/quality-standards',
    sidebar: 'Project → Quality Standards',
    quickAccess: 'Dashboard → Compliance Status widget',
    breadcrumb: 'Home > Project > Quality Standards'
  },
  
  howTo: {
    add: {
      title: 'Adding a Quality Standard',
      steps: [
        'Navigate to the Quality Standards page from the sidebar (Project → Quality Standards)',
        'Click the "Add Standard" button in the top right corner',
        'Enter the standard name (e.g., "ISO 27001 - Information Security")',
        'Select the category (Security, Accessibility, Data Protection, etc.)',
        'Provide a description of what the standard requires',
        'Add the source reference (regulation, policy document, etc.)',
        'Set the assessment frequency (how often compliance should be reviewed)',
        'Click "Save" to add the standard'
      ],
      tips: [
        'Use official standard names for consistency',
        'Link to source documents where possible',
        'Group related standards under appropriate categories',
        'Set realistic assessment frequencies based on risk',
        'Include both mandatory and best-practice standards'
      ],
      videoUrl: null
    },
    assess: {
      title: 'Performing a Compliance Assessment',
      steps: [
        'Navigate to the Quality Standards page',
        'Find the standard you want to assess',
        'Click "Assess" or open the standard details',
        'Review the current compliance status',
        'Select the new status: Compliant, Partially Compliant, or Non-Compliant',
        'Add assessment notes explaining your evaluation',
        'Upload or link supporting evidence',
        'Set the next assessment date',
        'Click "Save Assessment" to record your evaluation'
      ],
      tips: [
        'Be objective in your assessment',
        'Document specific gaps for partial or non-compliance',
        'Always provide evidence for compliance claims',
        'Schedule follow-up assessments for non-compliant items',
        'Consider involving subject matter experts for technical standards'
      ]
    },
    addEvidence: {
      title: 'Adding Compliance Evidence',
      steps: [
        'Open the quality standard you want to add evidence for',
        'Click the "Evidence" tab',
        'Click "Add Evidence" button',
        'Select the evidence type (Document, Screenshot, Link, Certificate)',
        'Upload the file or enter the URL',
        'Add a description explaining what this evidence demonstrates',
        'Set the evidence date (when it was captured)',
        'Click "Save" to attach the evidence'
      ],
      tips: [
        'Evidence should directly support compliance claims',
        'Include dates to show evidence is current',
        'Use descriptive names for uploaded files',
        'Screenshots should clearly show relevant information',
        'Certificates should be current and valid'
      ]
    },
    createAction: {
      title: 'Creating a Remediation Action',
      steps: [
        'Open a standard that is Partially Compliant or Non-Compliant',
        'Click the "Actions" tab',
        'Click "Add Remediation Action"',
        'Describe the action needed to achieve compliance',
        'Assign an owner responsible for the action',
        'Set a target completion date',
        'Set the priority level',
        'Click "Save" to create the action'
      ],
      tips: [
        'Actions should be specific and measurable',
        'Assign to individuals who can take action',
        'Set realistic deadlines based on complexity',
        'Track action completion to improve compliance status',
        'Link actions to specific compliance gaps'
      ]
    },
    view: {
      title: 'Viewing Quality Standards',
      steps: [
        'Navigate to the Quality Standards page',
        'View the list showing standard name, category, status, and last assessed date',
        'Use the status filter to show Compliant, Partially Compliant, or Non-Compliant',
        'Use the category filter to view specific types of standards',
        'Click on any standard to see full details, evidence, and actions',
        'Use the dashboard widget for a compliance summary'
      ],
      tips: [
        'Red/Amber/Green indicators show compliance at a glance',
        'Overdue assessments are flagged',
        'Export compliance reports for audits',
        'The summary shows overall compliance percentage'
      ]
    },
    report: {
      title: 'Generating Compliance Reports',
      steps: [
        'Navigate to the Quality Standards page',
        'Click the "Reports" button',
        'Select the report type (Summary, Detailed, Audit)',
        'Choose the standards to include (all or filtered)',
        'Select the date range for assessment history',
        'Click "Generate Report"',
        'Download as PDF or export to CSV'
      ],
      tips: [
        'Summary reports are good for executive updates',
        'Detailed reports include all evidence and actions',
        'Audit reports format data for external reviewers',
        'Schedule regular reports for governance meetings'
      ]
    }
  },
  
  fields: {
    name: {
      name: 'Name',
      label: 'Standard Name',
      required: true,
      type: 'text',
      description: 'The name of the quality standard or requirement',
      validation: 'Required. Maximum 200 characters.',
      tips: 'Use the official standard name where applicable.'
    },
    category: {
      name: 'Category',
      label: 'Category',
      required: true,
      type: 'select',
      description: 'The type or domain of the standard',
      values: ['Security', 'Accessibility', 'Data Protection', 'Performance', 'Documentation', 'Process', 'Regulatory', 'Other'],
      tips: 'Choose the category that best fits the standard.'
    },
    description: {
      name: 'Description',
      label: 'Description',
      required: true,
      type: 'textarea',
      description: 'Detailed description of what the standard requires',
      validation: 'Required. Maximum 2000 characters.',
      tips: 'Include specific requirements and acceptance criteria.'
    },
    source: {
      name: 'Source',
      label: 'Source Reference',
      required: false,
      type: 'text',
      description: 'Reference to the source regulation, policy, or document',
      tips: 'Include document names, URLs, or regulation numbers.'
    },
    status: {
      name: 'Status',
      label: 'Compliance Status',
      required: true,
      type: 'select',
      description: 'Current compliance status based on latest assessment',
      values: ['Not Assessed', 'Compliant', 'Partially Compliant', 'Non-Compliant'],
      tips: 'Update after each assessment.'
    },
    last_assessed: {
      name: 'Last Assessed',
      label: 'Last Assessment Date',
      required: false,
      type: 'date',
      description: 'When the standard was last assessed',
      tips: 'Automatically updated when assessments are recorded.'
    },
    next_assessment: {
      name: 'Next Assessment',
      label: 'Next Assessment Due',
      required: false,
      type: 'date',
      description: 'When the next assessment should be performed',
      tips: 'Set based on assessment frequency and risk level.'
    },
    assessor: {
      name: 'Assessor',
      label: 'Assessed By',
      required: false,
      type: 'select',
      description: 'Person who performed the last assessment',
      tips: 'Automatically recorded from the assessment.'
    },
    assessment_notes: {
      name: 'Assessment Notes',
      label: 'Assessment Notes',
      required: false,
      type: 'textarea',
      description: 'Notes from the most recent assessment',
      tips: 'Document findings, gaps, and observations.'
    }
  },
  
  statuses: {
    notAssessed: {
      name: 'Not Assessed',
      description: 'Standard has not yet been evaluated for compliance',
      colour: 'grey',
      action: 'Perform initial assessment to establish baseline'
    },
    compliant: {
      name: 'Compliant',
      description: 'Project fully meets the requirements of this standard',
      colour: 'green',
      action: 'Maintain compliance and schedule periodic re-assessment'
    },
    partiallyCompliant: {
      name: 'Partially Compliant',
      description: 'Project meets some but not all requirements',
      colour: 'amber',
      action: 'Create remediation actions to address gaps'
    },
    nonCompliant: {
      name: 'Non-Compliant',
      description: 'Project does not meet the requirements of this standard',
      colour: 'red',
      action: 'Urgent remediation required; escalate if critical'
    }
  },
  
  categories: {
    security: {
      name: 'Security',
      description: 'Information security, access control, and data protection standards',
      examples: ['ISO 27001', 'NIST Cybersecurity Framework', 'SOC 2']
    },
    accessibility: {
      name: 'Accessibility',
      description: 'Standards ensuring products are usable by people with disabilities',
      examples: ['WCAG 2.1', 'Section 508', 'EN 301 549']
    },
    dataProtection: {
      name: 'Data Protection',
      description: 'Privacy and personal data handling requirements',
      examples: ['GDPR', 'CCPA', 'Data Protection Act 2018']
    },
    performance: {
      name: 'Performance',
      description: 'System performance, reliability, and availability standards',
      examples: ['SLA targets', 'Response time requirements', 'Uptime guarantees']
    },
    documentation: {
      name: 'Documentation',
      description: 'Standards for project and technical documentation',
      examples: ['Documentation templates', 'Version control', 'Review processes']
    },
    process: {
      name: 'Process',
      description: 'Project management and delivery process standards',
      examples: ['Agile practices', 'Change management', 'Quality gates']
    },
    regulatory: {
      name: 'Regulatory',
      description: 'Industry-specific regulatory requirements',
      examples: ['FCA regulations', 'NHS standards', 'Government guidelines']
    }
  },
  
  permissions: {
    contributor: {
      role: 'Contributor',
      canView: 'All standards (read-only)',
      canCreate: false,
      canEdit: false,
      canAssess: false,
      canAddEvidence: false,
      notes: 'Contributors can view compliance status for awareness'
    },
    supplier_pm: {
      role: 'Supplier PM',
      canView: 'All standards',
      canCreate: true,
      canEdit: true,
      canAssess: true,
      canAddEvidence: true,
      canDelete: true,
      notes: 'Supplier PMs manage quality standards and assessments'
    },
    customer_pm: {
      role: 'Customer PM',
      canView: 'All standards',
      canCreate: true,
      canEdit: true,
      canAssess: true,
      canAddEvidence: true,
      canDelete: false,
      notes: 'Customer PMs can assess and add standards'
    },
    admin: {
      role: 'Admin',
      canView: 'All standards',
      canCreate: true,
      canEdit: true,
      canAssess: true,
      canAddEvidence: true,
      canDelete: true,
      notes: 'Admins have full access to quality management'
    },
    partner_admin: {
      role: 'Partner Admin',
      canView: 'All standards (read-only)',
      canCreate: false,
      canEdit: false,
      canAssess: false,
      canAddEvidence: false,
      notes: 'Partner Admins can view compliance status'
    },
    partner_user: {
      role: 'Partner User',
      canView: 'All standards (read-only)',
      canCreate: false,
      canEdit: false,
      canAssess: false,
      canAddEvidence: false,
      notes: 'Partner Users can view compliance status'
    }
  },
  
  faq: [
    {
      question: 'What is a quality standard?',
      answer: 'A quality standard is a documented requirement that the project must meet. This can include industry standards (ISO, WCAG), regulatory requirements (GDPR), organisational policies, or project-specific quality criteria.'
    },
    {
      question: 'How often should I assess compliance?',
      answer: 'Assessment frequency depends on the standard and risk level. Critical security standards may need monthly review, while documentation standards might be quarterly. Set the next assessment date based on risk and any changes to the project.'
    },
    {
      question: 'What evidence should I provide for compliance?',
      answer: 'Evidence should directly demonstrate compliance. This might include: test results, audit reports, certificates, screenshots of configurations, policy documents, training records, or third-party assessments. Evidence should be current and verifiable.'
    },
    {
      question: 'What is the difference between Partially Compliant and Non-Compliant?',
      answer: 'Partially Compliant means some requirements are met but gaps exist. Non-Compliant means fundamental requirements are not met. Partial compliance might be acceptable temporarily with a remediation plan; non-compliance typically requires urgent action.'
    },
    {
      question: 'How do I handle a failed assessment?',
      answer: 'Mark the standard as Partially or Non-Compliant, document the specific gaps in assessment notes, create remediation actions with owners and deadlines, and schedule a re-assessment. Escalate critical non-compliance to stakeholders.'
    },
    {
      question: 'Can I add custom quality standards?',
      answer: 'Yes, you can add any standards relevant to your project. Include internal policies, client requirements, or project-specific quality criteria. Use clear names and descriptions so the team understands what is required.'
    },
    {
      question: 'Who should perform assessments?',
      answer: 'Assessments should be performed by someone with knowledge of the standard requirements and the project implementation. This might be a PM, technical lead, or subject matter expert. Consider independent assessment for critical standards.'
    },
    {
      question: 'How do I prepare for an audit?',
      answer: 'Use the reporting feature to generate an audit report. Ensure all standards have current assessments, evidence is attached and dated, remediation actions are documented, and assessment notes explain the compliance rationale.'
    }
  ],
  
  related: ['kpis', 'deliverables', 'workflows', 'audit-log', 'project-settings']
};

export default qualityStandardsGuide;
