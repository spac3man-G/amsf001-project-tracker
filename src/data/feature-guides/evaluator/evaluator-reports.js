// Evaluator Reports Feature Guide
// Complete how-to documentation for evaluation reporting

const evaluatorReportsGuide = {
  id: 'evaluator-reports',
  title: 'Evaluation Reports',
  category: 'evaluator',
  description: 'Generate comprehensive reports from your evaluation. Create executive summaries, detailed score breakdowns, vendor comparisons, and recommendation documents for stakeholder decision-making.',
  
  navigation: {
    path: '/evaluator/:id/reports',
    sidebar: 'Evaluator → [Evaluation] → Reports',
    quickAccess: 'Evaluation Dashboard → "Generate Report" button',
    breadcrumb: 'Home > Evaluator > [Evaluation Name] > Reports'
  },
  
  howTo: {
    generate: {
      title: 'Generating an Evaluation Report',
      steps: [
        'Navigate to your evaluation\'s Reports page',
        'Click "Generate Report" button',
        'Select the report type',
        'Configure report options (vendors, sections, date range)',
        'Choose the output format (PDF, Word, Excel)',
        'Click "Preview" to review before generating',
        'Click "Generate" to create the report',
        'Download or share the completed report'
      ],
      tips: [
        'Ensure all scoring is complete before final reports',
        'Preview reports before sharing with stakeholders',
        'Use consistent formatting across all reports',
        'Include executive summary for senior stakeholders'
      ]
    },
    customise: {
      title: 'Customising Report Content',
      steps: [
        'In the report configuration dialog, go to "Sections"',
        'Select which sections to include',
        'Reorder sections using drag and drop',
        'Configure options for each section',
        'Add custom text for executive summary or recommendations',
        'Include or exclude specific vendors',
        'Add your organisation logo',
        'Save as template for reuse'
      ],
      customisableElements: [
        { element: 'Sections', description: 'Add, remove, or reorder report sections' },
        { element: 'Vendors', description: 'Include all or specific vendors' },
        { element: 'Categories', description: 'Show all or specific requirement categories' },
        { element: 'Branding', description: 'Add logo and organisation name' },
        { element: 'Text', description: 'Add custom executive summary, conclusions' },
        { element: 'Charts', description: 'Choose chart types and styling' }
      ],
      tips: [
        'Create different reports for different audiences',
        'Save templates for recurring evaluation types',
        'Executive summary should fit on one page'
      ]
    },
    export: {
      title: 'Exporting Reports',
      steps: [
        'After generating a report, click "Export"',
        'Select the format: PDF, Word, Excel, or PowerPoint',
        'Configure export options (page size, orientation)',
        'Click "Download" to save to your device',
        'Or click "Share" to send directly to stakeholders'
      ],
      exportFormats: [
        { format: 'PDF', description: 'Professional document format, best for sharing', recommended: true },
        { format: 'Word (.docx)', description: 'Editable format, allows customisation' },
        { format: 'Excel (.xlsx)', description: 'Data export with all scores and calculations' },
        { format: 'PowerPoint (.pptx)', description: 'Presentation format for steering committees' }
      ],
      tips: [
        'PDF is best for official distribution',
        'Word allows stakeholders to add comments',
        'Excel is useful for detailed analysis',
        'PowerPoint for presentation to leadership'
      ]
    },
    schedule: {
      title: 'Scheduling Automatic Reports',
      steps: [
        'From the Reports page, click "Schedule Report"',
        'Select the report type to schedule',
        'Configure the report content and format',
        'Set the schedule: Daily, Weekly, or specific dates',
        'Select recipients to receive the report',
        'Enable or disable the schedule',
        'Scheduled reports generate and send automatically'
      ],
      tips: [
        'Weekly progress reports keep stakeholders informed',
        'Schedule final reports for evaluation close date',
        'Include relevant stakeholders as recipients'
      ]
    },
    share: {
      title: 'Sharing Reports with Stakeholders',
      steps: [
        'Open the generated report',
        'Click "Share" button',
        'Select sharing method: Email, Link, or Download',
        'For Email: Enter recipient addresses',
        'Add a message explaining the report',
        'Set access expiry for shared links',
        'Track who has viewed the report'
      ],
      sharingOptions: [
        { method: 'Email', description: 'Send PDF directly to recipients' },
        { method: 'Secure Link', description: 'Share a view-only link with expiry' },
        { method: 'Download', description: 'Download and share manually' }
      ],
      tips: [
        'Use secure links for sensitive reports',
        'Set expiry dates on shared links',
        'Track viewership for important documents'
      ]
    },
    view: {
      title: 'Viewing Report History',
      steps: [
        'Navigate to the Reports page',
        'The report list shows all generated reports',
        'Filter by: Type, Date, Author',
        'Click any report to preview or download',
        'View report metadata: generated date, author, recipients',
        'Access previous versions of reports'
      ],
      tips: [
        'Reports are saved automatically',
        'Previous versions preserved for audit',
        'Delete old drafts to keep list manageable'
      ]
    }
  },
  
  reportTypes: {
    title: 'Available Report Types',
    types: [
      {
        type: 'Executive Summary',
        purpose: 'High-level overview for senior stakeholders and decision makers',
        audience: 'Executives, Steering Committee',
        sections: [
          'Evaluation overview and objectives',
          'Methodology summary',
          'Vendor comparison chart',
          'Recommendation',
          'Key risks and considerations',
          'Next steps'
        ],
        length: '2-4 pages',
        tips: 'Focus on decision, not details. Clear recommendation.'
      },
      {
        type: 'Detailed Evaluation Report',
        purpose: 'Comprehensive documentation of the entire evaluation',
        audience: 'Project team, Audit, Records',
        sections: [
          'Executive summary',
          'Evaluation methodology',
          'Requirements overview',
          'Vendor profiles',
          'Detailed scoring by category',
          'Score analysis and comparison',
          'Recommendation with rationale',
          'Appendices'
        ],
        length: '20-50 pages',
        tips: 'Full audit trail. Include all evidence and rationale.'
      },
      {
        type: 'Vendor Comparison',
        purpose: 'Side-by-side comparison of evaluated vendors',
        audience: 'Evaluation team, Stakeholders',
        sections: [
          'Comparison overview',
          'Score comparison table',
          'Category breakdown charts',
          'Strengths and weaknesses',
          'Feature comparison matrix',
          'Price comparison (if included)'
        ],
        length: '5-10 pages',
        tips: 'Visual charts help. Focus on differentiators.'
      },
      {
        type: 'Scoring Summary',
        purpose: 'Score breakdown for review and validation',
        audience: 'Evaluation team',
        sections: [
          'Overall scores by vendor',
          'Scores by category',
          'Individual requirement scores',
          'Evaluator coverage',
          'Score distribution analysis'
        ],
        length: '10-20 pages',
        tips: 'Use before consensus to identify variance.'
      },
      {
        type: 'Recommendation Report',
        purpose: 'Formal recommendation for approval',
        audience: 'Decision makers, Procurement',
        sections: [
          'Recommendation statement',
          'Selection criteria summary',
          'Recommended vendor profile',
          'Scoring justification',
          'Risk assessment',
          'Implementation considerations',
          'Commercial summary',
          'Approval request'
        ],
        length: '5-10 pages',
        tips: 'Clear recommendation with supporting evidence.'
      },
      {
        type: 'Progress Report',
        purpose: 'Status update during evaluation',
        audience: 'Stakeholders, Steering Committee',
        sections: [
          'Evaluation status',
          'Completed activities',
          'Upcoming milestones',
          'Risks and issues',
          'Key decisions needed'
        ],
        length: '2-3 pages',
        tips: 'Brief and focused. Highlight blockers.'
      }
    ]
  },
  
  reportSections: {
    title: 'Report Section Reference',
    sections: [
      {
        section: 'Executive Summary',
        description: 'High-level overview of evaluation and recommendation',
        includes: ['Key findings', 'Recommendation', 'Next steps'],
        tips: 'Write last after completing other sections'
      },
      {
        section: 'Methodology',
        description: 'How the evaluation was conducted',
        includes: ['Scoring approach', 'Team composition', 'Timeline'],
        tips: 'Important for audit and credibility'
      },
      {
        section: 'Requirements Analysis',
        description: 'Overview of evaluation criteria',
        includes: ['Category breakdown', 'Priority distribution', 'Total requirements'],
        tips: 'Shows evaluation scope'
      },
      {
        section: 'Vendor Overview',
        description: 'Summary of each vendor evaluated',
        includes: ['Company profile', 'Product description', 'Participation summary'],
        tips: 'Brief factual overview'
      },
      {
        section: 'Scoring Results',
        description: 'Detailed score breakdown',
        includes: ['Overall scores', 'Category scores', 'Requirement scores'],
        tips: 'Include charts for visual impact'
      },
      {
        section: 'Comparison Analysis',
        description: 'Side-by-side vendor comparison',
        includes: ['Comparative tables', 'Radar charts', 'Gap analysis'],
        tips: 'Focus on meaningful differences'
      },
      {
        section: 'Strengths & Weaknesses',
        description: 'Key differentiators for each vendor',
        includes: ['Top strengths', 'Main concerns', 'Unique capabilities'],
        tips: 'Be specific and evidence-based'
      },
      {
        section: 'Risk Assessment',
        description: 'Evaluation of vendor risks',
        includes: ['Vendor viability', 'Implementation risk', 'Strategic risk'],
        tips: 'Include mitigation strategies'
      },
      {
        section: 'Recommendation',
        description: 'Final recommendation with rationale',
        includes: ['Selected vendor', 'Decision rationale', 'Conditions/caveats'],
        tips: 'Clear, defensible recommendation'
      },
      {
        section: 'Appendices',
        description: 'Supporting detailed information',
        includes: ['Full score tables', 'Requirement list', 'Vendor responses', 'Meeting notes'],
        tips: 'Reference material for detailed review'
      }
    ]
  },
  
  charts: {
    title: 'Available Charts and Visualisations',
    chartTypes: [
      {
        chart: 'Overall Score Bar Chart',
        description: 'Horizontal bars showing total score per vendor',
        bestFor: 'Quick ranking comparison',
        data: 'Overall weighted score per vendor'
      },
      {
        chart: 'Category Comparison',
        description: 'Grouped bar chart showing scores by category',
        bestFor: 'Understanding strengths by area',
        data: 'Category scores per vendor'
      },
      {
        chart: 'Radar/Spider Chart',
        description: 'Multi-axis chart showing category balance',
        bestFor: 'Visual profile of vendor capabilities',
        data: 'Category scores as percentages'
      },
      {
        chart: 'Score Distribution',
        description: 'Histogram showing score spread',
        bestFor: 'Understanding scoring patterns',
        data: 'All individual scores'
      },
      {
        chart: 'Heat Map',
        description: 'Color-coded matrix of requirements × vendors',
        bestFor: 'Identifying patterns and gaps',
        data: 'Individual requirement scores'
      },
      {
        chart: 'Gap Analysis',
        description: 'Bar chart showing difference from top vendor',
        bestFor: 'Quantifying vendor differences',
        data: 'Score difference per category'
      },
      {
        chart: 'Trend Chart',
        description: 'Line chart showing score changes over time',
        bestFor: 'Progress tracking during evaluation',
        data: 'Scores at different time points'
      }
    ]
  },
  
  permissions: {
    evaluation_admin: {
      role: 'Evaluation Admin',
      canGenerate: true,
      canCustomise: true,
      canSchedule: true,
      canShare: true,
      canViewHistory: true,
      notes: 'Full access to all reporting functions'
    },
    evaluator: {
      role: 'Evaluator',
      canGenerate: 'Own scoring summary only',
      canCustomise: false,
      canSchedule: false,
      canShare: false,
      canViewHistory: 'Own reports only',
      notes: 'Can view shared reports and own scoring data'
    },
    reviewer: {
      role: 'Reviewer',
      canGenerate: true,
      canCustomise: true,
      canSchedule: false,
      canShare: false,
      canViewHistory: true,
      notes: 'Can generate and customise reports but not share'
    },
    observer: {
      role: 'Observer',
      canGenerate: false,
      canCustomise: false,
      canSchedule: false,
      canShare: false,
      canViewHistory: 'Summary reports only',
      notes: 'Can view published summary reports'
    }
  },
  
  faq: [
    {
      question: 'When should I generate the final report?',
      answer: 'Generate final reports after all scoring is complete and any consensus discussions have been held. Ensure all data is final as the report will be part of the audit record.'
    },
    {
      question: 'Can I edit a report after generating it?',
      answer: 'Generated reports are static snapshots. To make changes, regenerate the report with updated settings. You can edit exported Word documents. PDF reports cannot be edited.'
    },
    {
      question: 'How do I add custom text to reports?',
      answer: 'In report configuration, use the "Custom Content" option to add executive summary text, conclusions, or recommendations. These appear in the designated sections.'
    },
    {
      question: 'Can I include vendor pricing in reports?',
      answer: 'If pricing data was collected, it can be included in reports. Check the "Include Commercial Data" option. Consider audience - some stakeholders should not see pricing details.'
    },
    {
      question: 'How do I create a report template?',
      answer: 'Configure a report with your preferred sections and settings. Click "Save as Template" and give it a name. Use the template for future reports of the same type.'
    },
    {
      question: 'What format is best for steering committee presentations?',
      answer: 'Export as PowerPoint for presentations, or use PDF for read-ahead documents. Executive Summary report type is designed for this audience.'
    },
    {
      question: 'Can I share reports with vendors?',
      answer: 'You can share debrief reports with vendors after selection. Be cautious about sharing competitive scoring data. Consider a vendor-specific report showing only their results.'
    },
    {
      question: 'Are reports tracked for audit purposes?',
      answer: 'Yes, all generated reports are logged with timestamp, author, and content. This provides an audit trail of what was reported and when.'
    },
    {
      question: 'How do I include all detailed scores in the report?',
      answer: 'Use the Detailed Evaluation Report type and ensure "Include Full Score Tables" is selected. This adds complete requirement-level scores to the appendices.'
    },
    {
      question: 'Can I automate report generation?',
      answer: 'Yes, use the Schedule Report feature to automatically generate and distribute reports at set intervals or on specific dates.'
    }
  ],
  
  related: ['evaluation-setup', 'scoring', 'vendors', 'workshops']
};

export default evaluatorReportsGuide;
