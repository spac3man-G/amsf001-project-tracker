// AI Intelligence Feature Guide
// Complete how-to documentation for AI-powered features

const aiIntelligenceGuide = {
  id: 'ai-intelligence',
  title: 'AI Intelligence Features',
  category: 'general',
  description: 'AI Intelligence features provide proactive analysis, recommendations, and action execution across the application. The AI monitors project health, detects anomalies, assists with approvals, forecasts completion, generates documents, provides portfolio-level insights, and can execute actions via the chat assistant with your explicit confirmation. All AI features require human approval before making changes.',

  navigation: {
    path: '/dashboard',
    sidebar: 'Dashboard (AI widgets), Reports (Document Generator), Organisation Admin (Portfolio Insights)',
    quickAccess: 'Dashboard shows AI panels automatically on page load',
    breadcrumb: 'Home > Dashboard'
  },

  howTo: {
    viewForecasts: {
      title: 'Viewing Project Forecasts',
      steps: [
        'Navigate to the Dashboard',
        'Look for the "Project Forecast" panel in the main content area',
        'View the overall health score (0-100) with traffic light colour',
        'Check the completion forecast showing predicted vs planned dates',
        'Review the budget forecast showing expected final cost',
        'Switch between Overview, Schedule, and Budget tabs for detailed views',
        'Review key insights and recommendations at the bottom of the panel'
      ],
      tips: [
        'Health score updates automatically when you refresh the dashboard',
        'Confidence intervals show the range of likely outcomes',
        'At-risk milestones are highlighted for attention',
        'Recommendations are actionable suggestions to improve trajectory',
        'Velocity trends show if the project is speeding up or slowing down'
      ],
      videoUrl: null
    },
    viewAnomalies: {
      title: 'Viewing Anomaly Alerts',
      steps: [
        'Navigate to the Dashboard',
        'Look for the "Anomaly Alerts" widget in the sidebar',
        'View the alert count badge showing how many issues were detected',
        'Click the widget header to expand and see all alerts',
        'Review each alert which includes severity, title, description, and suggested action',
        'Click on an alert to navigate to the affected item'
      ],
      tips: [
        'Alerts are sorted by severity (high, medium, low)',
        'Common anomalies include: unusual timesheet hours, duplicate expenses, approaching deadlines',
        'Anomaly detection runs automatically when you load the dashboard',
        'Click refresh to re-run the analysis',
        'Addressing alerts early prevents problems from escalating'
      ]
    },
    viewApprovalAssistant: {
      title: 'Using the Approval Assistant',
      steps: [
        'Navigate to the Dashboard (only visible if you have approval permissions)',
        'Look for the "Approval Assistant" widget in the sidebar',
        'View the summary showing items recommended for approval vs needing review',
        'Click the widget header to expand and see category breakdown',
        'Review each category (timesheets, expenses, deliverables) with AI recommendations',
        'Note flagged items that need closer review',
        'Click a category to navigate to the approval queue'
      ],
      tips: [
        'The widget only appears if you can approve timesheets, expenses, or deliverables',
        '"Recommend Approve" means items look standard based on patterns',
        '"Needs Review" means items have unusual characteristics',
        'Flagged items show specific reasons for caution',
        'Always review items before approving - AI recommendations are suggestions'
      ]
    },
    generateDocument: {
      title: 'Generating AI Documents',
      steps: [
        'Navigate to the Reports page',
        'Find the "AI Document Generator" section',
        'Select the document type from the dropdown (Status Report, Project Summary, etc.)',
        'Click "Generate" to create the document',
        'Wait for the AI to analyse project data and generate content (10-30 seconds)',
        'Review the generated document in the preview panel',
        'Use "Copy" to copy the content to clipboard, or "Download" to save as Markdown'
      ],
      tips: [
        'Status Reports are best for periodic updates to stakeholders',
        'Project Summaries provide high-level overviews for executives',
        'RAID Summaries consolidate all risks, assumptions, issues, and dependencies',
        'Handover Documents are comprehensive packs for project transitions',
        'Generated documents are starting points - edit as needed before sharing'
      ]
    },
    viewPortfolioInsights: {
      title: 'Viewing Portfolio Insights (Org Admins)',
      steps: [
        'Navigate to Organisation Admin from the user menu',
        'Click the "Insights" tab',
        'View the portfolio health score and executive summary',
        'Review key metrics (active projects, budget utilization, on-track percentage)',
        'Check "Projects Needing Attention" for items requiring intervention',
        'Expand "Risk Patterns" to see common issues across projects',
        'Review "Strategic Recommendations" for portfolio-level actions'
      ],
      tips: [
        'Portfolio Insights is only available to organisation admins',
        'The analysis covers all projects in your organisation',
        'Projects needing attention are prioritised by urgency',
        'Risk patterns identify systemic issues affecting multiple projects',
        'Strategic recommendations suggest portfolio-level improvements'
      ]
    },
    useChatActions: {
      title: 'Using Chat Actions (AI Action Framework)',
      steps: [
        'Open the chat assistant from the bottom-right corner of any page',
        'Type a natural language command like "Submit my timesheets" or "Mark milestone Design Complete as done"',
        'The AI will show a preview of what will happen (e.g., "3 timesheets totaling 24 hours")',
        'Review the preview carefully to ensure it matches your intent',
        'Type "Yes", "Confirm", or "Do it" to proceed with the action',
        'The AI will execute the action and confirm success',
        'To cancel, type "No", "Cancel", or simply change the subject'
      ],
      availableActions: [
        { action: 'Submit timesheets', examples: ['Submit my timesheets', 'Submit all timesheets for this week'] },
        { action: 'Submit expenses', examples: ['Submit my expenses', 'Submit all draft expenses'] },
        { action: 'Update milestone', examples: ['Mark milestone X as done', 'Set milestone X progress to 75%'] },
        { action: 'Update deliverable', examples: ['Mark deliverable Y as Delivered', 'Set deliverable status to In Progress'] },
        { action: 'Complete task', examples: ['Mark task Z as complete', 'Complete task "Write tests"'] },
        { action: 'Reassign task', examples: ['Reassign task X to Sarah', 'Move task to John'] },
        { action: 'Update RAID item', examples: ['Close risk R-001', 'Set issue I-023 to In Progress'] },
        { action: 'Resolve RAID item', examples: ['Resolve risk R-001 with note "Vendor confirmed"', 'Close issue I-023'] },
        { action: 'Assign RAID owner', examples: ['Assign risk R-001 to Sarah', 'Change owner of I-023 to John'] }
      ],
      tips: [
        'The AI always shows a preview before executing - never changes data without your confirmation',
        'You must have the appropriate permissions - the AI respects your role',
        'Use names or references (R-001, I-023) to identify items',
        'If multiple items match, the AI will ask you to be more specific',
        'Bulk actions like "submit all timesheets" are faster than clicking through each one',
        'You can ask the AI to query first ("show my draft timesheets") before taking action'
      ]
    }
  },

  concepts: {
    humanInControl: {
      title: 'Human-in-Control Design',
      description: 'All AI features require explicit human approval. Query features provide recommendations that you can accept or ignore. Action features (via chat) show a preview and wait for your confirmation before executing. The AI never makes changes automatically. You remain in control of all decisions and actions.'
    },
    actionFramework: {
      title: 'AI Action Framework',
      description: 'The AI Action Framework allows you to execute actions via natural language commands in the chat assistant. When you ask to perform an action (like submitting timesheets or updating a milestone), the AI first shows a preview of what will happen. Only after you explicitly confirm will the action be executed. This combines convenience with safety.'
    },
    healthScore: {
      title: 'Health Score',
      description: 'The health score (0-100) is a composite metric that considers schedule adherence, budget variance, milestone completion, risk levels, and overall progress. Higher scores indicate healthier projects. Scores above 80 are typically green (on track), 60-80 are amber (attention needed), and below 60 are red (at risk).'
    },
    aiRecommendations: {
      title: 'AI Recommendations',
      description: 'AI recommendations are suggestions based on pattern analysis and project data. They help identify issues and opportunities but should always be reviewed in context. The AI cannot account for all business factors, so use recommendations as input to your decision-making, not as final answers.'
    },
    anomalyDetection: {
      title: 'Anomaly Detection',
      description: 'Anomaly detection automatically scans project data for unusual patterns: duplicate entries, policy violations, approaching deadlines, stalled progress, and more. Alerts are categorised by severity and include suggested actions. Regular review of anomalies helps catch issues before they escalate.'
    },
    forecasting: {
      title: 'Forecasting',
      description: 'Project forecasting uses historical velocity, current progress, and trend analysis to predict likely outcomes. Forecasts include confidence intervals showing the range of possible results. Predictions become more accurate as more project data accumulates.'
    }
  },

  aiFeatures: {
    summary: 'AI features are integrated throughout the application',
    features: [
      {
        name: 'Project Forecast Panel',
        location: 'Dashboard',
        purpose: 'Health score, completion predictions, budget forecast, velocity trends',
        automatic: true
      },
      {
        name: 'Anomaly Alerts Widget',
        location: 'Dashboard',
        purpose: 'Detect unusual patterns in timesheets, expenses, milestones, deliverables',
        automatic: true
      },
      {
        name: 'Approval Assistant Widget',
        location: 'Dashboard (for users with approval permissions)',
        purpose: 'Summarise pending approvals with recommendations',
        automatic: true
      },
      {
        name: 'AI Document Generator',
        location: 'Reports page',
        purpose: 'Generate status reports, project summaries, RAID summaries, handover documents',
        automatic: false
      },
      {
        name: 'Quality Assessment Panel',
        location: 'Deliverable detail panel',
        purpose: 'Evaluate deliverable readiness for sign-off',
        automatic: true
      },
      {
        name: 'Impact Analysis Panel',
        location: 'Variation detail page',
        purpose: 'Analyse timeline, budget, and scope impacts of proposed changes',
        automatic: true
      },
      {
        name: 'RAID Categorization',
        location: 'RAID Add Form',
        purpose: 'Suggest category, severity, and probability for new RAID items',
        automatic: false
      },
      {
        name: 'Portfolio Insights',
        location: 'Organisation Admin > Insights tab',
        purpose: 'Cross-project analysis and strategic recommendations',
        automatic: true
      },
      {
        name: 'Chat Actions (AI Action Framework)',
        location: 'Chat Assistant (available on all pages)',
        purpose: 'Execute actions via natural language: submit timesheets/expenses, update milestones/deliverables, complete tasks, manage RAID items',
        automatic: false
      }
    ]
  },

  permissions: {
    viewer: {
      role: 'Viewer',
      canViewForecasts: true,
      canViewAnomalies: true,
      canViewApprovalAssistant: false,
      canGenerateDocuments: false,
      canViewPortfolioInsights: false,
      notes: 'Viewers can see project-level AI insights but not generate or approve'
    },
    contributor: {
      role: 'Contributor',
      canViewForecasts: true,
      canViewAnomalies: true,
      canViewApprovalAssistant: false,
      canGenerateDocuments: true,
      canViewPortfolioInsights: false,
      notes: 'Contributors can view insights and generate documents'
    },
    supplier_pm: {
      role: 'Supplier PM',
      canViewForecasts: true,
      canViewAnomalies: true,
      canViewApprovalAssistant: true,
      canGenerateDocuments: true,
      canViewPortfolioInsights: true,
      notes: 'Supplier PMs have full access to all AI features'
    },
    customer_pm: {
      role: 'Customer PM',
      canViewForecasts: true,
      canViewAnomalies: true,
      canViewApprovalAssistant: true,
      canGenerateDocuments: true,
      canViewPortfolioInsights: false,
      notes: 'Customer PMs can use project-level AI features'
    },
    org_admin: {
      role: 'Organisation Admin',
      canViewForecasts: true,
      canViewAnomalies: true,
      canViewApprovalAssistant: true,
      canGenerateDocuments: true,
      canViewPortfolioInsights: true,
      notes: 'Org Admins have full access including Portfolio Insights'
    }
  },

  faq: [
    {
      question: 'Are AI features automatic?',
      answer: 'Most AI features run automatically when you load a page. Dashboard widgets (forecasts, anomalies, approvals) analyse data on page load. Some features like document generation require you to click a button. No AI feature makes changes automatically - they only provide recommendations.'
    },
    {
      question: 'How accurate are AI predictions?',
      answer: 'AI predictions are estimates based on available data. Accuracy improves as more project data accumulates. Predictions include confidence intervals showing the range of likely outcomes. Always apply your business context - the AI cannot account for all factors.'
    },
    {
      question: 'Why do I not see the Approval Assistant widget?',
      answer: 'The Approval Assistant only appears if you have permission to approve timesheets, expenses, or deliverables. If you are a Viewer or Contributor without approval rights, this widget will not be shown.'
    },
    {
      question: 'How often does the AI analyse project data?',
      answer: 'AI analysis runs when you load pages that include AI features. Click the refresh button on any AI widget to re-run the analysis. There is no background analysis - insights are generated on demand.'
    },
    {
      question: 'Can I disable AI features?',
      answer: 'AI features are built into the application and cannot be disabled individually. However, they are advisory only and do not affect your workflow if you choose to ignore the recommendations.'
    },
    {
      question: 'What data does the AI use?',
      answer: 'The AI analyses project data you already have access to: milestones, deliverables, timesheets, expenses, RAID items, and more. It does not access data from other projects or organisations. Analysis is performed using your current permissions.'
    },
    {
      question: 'Why is the AI recommendation different from what I expected?',
      answer: 'AI recommendations are based on patterns and data analysis. They may not account for context you know but the AI does not. Use recommendations as one input to your decision-making, not as the final answer. Your judgement should always prevail.'
    },
    {
      question: 'Where can I find AI features in the application?',
      answer: 'AI features are integrated throughout: Dashboard (forecasts, anomalies, approvals), Reports (document generation), Deliverables (quality assessment), Variations (impact analysis), RAID (categorization suggestions), Organisation Admin (portfolio insights), and the Chat Assistant (action execution).'
    },
    {
      question: 'Can the AI make changes to my project data?',
      answer: 'The AI can execute actions via the chat assistant, but only with your explicit confirmation. When you request an action (like "submit my timesheets"), the AI first shows exactly what will happen and asks you to confirm. Nothing changes until you say "yes" or "confirm". You remain fully in control.'
    },
    {
      question: 'What actions can the AI perform?',
      answer: 'Via the chat assistant, the AI can: submit timesheets and expenses, update milestone status and progress, update deliverable status, complete or reassign tasks, update RAID item status, resolve RAID items with notes, and reassign RAID item owners. All actions require your confirmation and respect your permissions.'
    },
    {
      question: 'Why did the AI say I do not have permission to perform an action?',
      answer: 'The AI respects your role permissions. If you ask to perform an action you cannot do in the regular UI (like updating milestones when you are a Viewer), the AI will also prevent it. Check your role permissions or contact an admin if you need additional access.'
    },
    {
      question: 'Can I undo an action the AI performed?',
      answer: 'Most actions can be reversed by performing the opposite action (e.g., changing a status back). Submitted timesheets and expenses follow normal approval workflows. The AI does not have a specific "undo" command, but you can always make further changes through the chat or regular UI.'
    }
  ],

  related: ['navigation', 'deliverables', 'variations', 'raid', 'organisation-admin']
};

export default aiIntelligenceGuide;
