// Audit Log Feature Guide
// Complete how-to documentation for audit log functionality

const auditLogGuide = {
  id: 'audit-log',
  title: 'Audit Log',
  category: 'admin',
  description: 'Track and review all activity in the project with the audit log. View who did what and when, filter by action type or user, and export logs for compliance and investigation purposes.',
  
  navigation: {
    path: '/admin/audit-log',
    sidebar: 'Admin → Audit Log',
    quickAccess: 'Admin Menu → View Audit Log',
    breadcrumb: 'Home > Admin > Audit Log'
  },
  
  howTo: {
    view: {
      title: 'Viewing the Audit Log',
      steps: [
        'Navigate to Admin → Audit Log',
        'The log displays recent activity chronologically',
        'Each entry shows: timestamp, user, action, entity, details',
        'Scroll or use pagination to see older entries',
        'Click any entry to expand and see full details'
      ],
      logEntry: {
        fields: [
          { field: 'Timestamp', description: 'Exact date and time of the action' },
          { field: 'User', description: 'Who performed the action' },
          { field: 'Action', description: 'What type of action (Create, Update, Delete, etc.)' },
          { field: 'Entity', description: 'What was affected (Timesheet, Expense, etc.)' },
          { field: 'Entity ID', description: 'Specific item identifier' },
          { field: 'Details', description: 'What changed (old value → new value)' },
          { field: 'IP Address', description: 'Where the action came from' }
        ]
      },
      tips: [
        'Most recent entries appear first',
        'Expand entries to see change details',
        'Note timestamps are in your local timezone'
      ]
    },
    filter: {
      title: 'Filtering the Audit Log',
      steps: [
        'Use the filter panel on the left side',
        'Select filters: Date Range, User, Action Type, Entity Type',
        'Apply multiple filters for precise searches',
        'Results update as you apply filters',
        'Click "Clear Filters" to reset'
      ],
      filterOptions: [
        { filter: 'Date Range', description: 'From and to dates for the period' },
        { filter: 'User', description: 'Specific user who performed actions' },
        { filter: 'Action Type', description: 'Create, Update, Delete, View, Export, etc.' },
        { filter: 'Entity Type', description: 'Timesheets, Expenses, Milestones, etc.' },
        { filter: 'Entity ID', description: 'Specific item by ID' }
      ],
      tips: [
        'Date range filter is most useful for investigations',
        'Combine user + entity type to see all their actions on that type',
        'Entity ID filter helps track changes to specific items'
      ]
    },
    search: {
      title: 'Searching the Audit Log',
      steps: [
        'Use the search box at the top of the audit log',
        'Enter search terms (user name, entity ID, action description)',
        'Results filter as you type',
        'Search looks across all visible fields',
        'Combine with filters for more precise results'
      ],
      searchableFields: [
        'User name and email',
        'Entity names and IDs',
        'Action descriptions',
        'Change details'
      ],
      tips: [
        'Use exact entity IDs for precise results',
        'Search is case-insensitive',
        'Partial matches are supported'
      ]
    },
    export: {
      title: 'Exporting Audit Logs',
      steps: [
        'Apply any filters to narrow the data you want',
        'Click "Export" button in the toolbar',
        'Select the format: CSV, Excel, or PDF',
        'Choose columns to include',
        'Set date range if not already filtered',
        'Click "Download" to save the file',
        'File includes all filtered entries'
      ],
      exportFormats: [
        { format: 'CSV', description: 'For data analysis and import to other systems' },
        { format: 'Excel', description: 'Formatted spreadsheet with headers' },
        { format: 'PDF', description: 'Formatted document for compliance records' }
      ],
      tips: [
        'Filter before export to reduce file size',
        'PDF includes formatting suitable for official records',
        'Export regularly for compliance archives'
      ]
    },
    investigate: {
      title: 'Investigating Specific Changes',
      steps: [
        'Identify the item you want to investigate',
        'Filter by Entity Type and Entity ID',
        'Or search for the item name or ID',
        'View all actions on that item chronologically',
        'Expand entries to see before/after values',
        'Note the user and timestamp for each change',
        'Export if needed for documentation'
      ],
      investigationScenarios: [
        { scenario: 'Who changed this value?', approach: 'Filter by entity ID, look for Update actions' },
        { scenario: 'What did user X do?', approach: 'Filter by user, review all their actions' },
        { scenario: 'When was this deleted?', approach: 'Filter by entity ID, look for Delete action' },
        { scenario: 'Track approval history', approach: 'Filter by entity, look for status changes' }
      ],
      tips: [
        'Old/new values show exactly what changed',
        'System actions show as "System" user',
        'Timeline view helps understand sequence of events'
      ]
    },
    timeline: {
      title: 'Viewing Entity Timeline',
      steps: [
        'Navigate to any item (timesheet, expense, etc.)',
        'Click the "History" or "Activity" tab',
        'View the timeline of all changes to this item',
        'Each entry shows who, when, and what changed',
        'This is a filtered view of the audit log for that item'
      ],
      tips: [
        'Faster than searching audit log for one item',
        'Available on most entity detail pages',
        'Includes comments and status changes'
      ]
    }
  },
  
  trackedActions: {
    title: 'What Gets Tracked',
    description: 'The audit log captures all significant actions in the system.',
    categories: [
      {
        category: 'Data Changes',
        actions: [
          { action: 'Create', description: 'New item created' },
          { action: 'Update', description: 'Item modified (shows old/new values)' },
          { action: 'Delete', description: 'Item removed' },
          { action: 'Restore', description: 'Deleted item restored' }
        ]
      },
      {
        category: 'Workflow Actions',
        actions: [
          { action: 'Submit', description: 'Item submitted for approval' },
          { action: 'Validate', description: 'Item validated' },
          { action: 'Approve', description: 'Item approved' },
          { action: 'Reject', description: 'Item rejected with notes' }
        ]
      },
      {
        category: 'Access & Security',
        actions: [
          { action: 'Login', description: 'User logged in' },
          { action: 'Logout', description: 'User logged out' },
          { action: 'Failed Login', description: 'Failed login attempt' },
          { action: 'Password Change', description: 'Password updated' },
          { action: 'Role Change', description: 'User role modified' }
        ]
      },
      {
        category: 'Export & Reports',
        actions: [
          { action: 'Export', description: 'Data exported' },
          { action: 'Report Generated', description: 'Report created' },
          { action: 'Download', description: 'File downloaded' }
        ]
      },
      {
        category: 'Configuration',
        actions: [
          { action: 'Settings Change', description: 'Project or org settings modified' },
          { action: 'Team Change', description: 'Team member added/removed/role changed' },
          { action: 'Integration', description: 'Integration enabled/disabled/configured' }
        ]
      }
    ]
  },
  
  entityTypes: {
    title: 'Tracked Entity Types',
    entities: [
      { type: 'Timesheet', description: 'Time entry records' },
      { type: 'Expense', description: 'Expense claims and receipts' },
      { type: 'Milestone', description: 'Project milestones' },
      { type: 'Deliverable', description: 'Work products and tasks' },
      { type: 'Resource', description: 'Team member resource records' },
      { type: 'Variation', description: 'Change requests' },
      { type: 'RAID Item', description: 'Risks, assumptions, issues, dependencies' },
      { type: 'Invoice', description: 'Partner invoices' },
      { type: 'User', description: 'User accounts and profiles' },
      { type: 'Project', description: 'Project configuration' },
      { type: 'Organisation', description: 'Organisation settings' },
      { type: 'Evaluation', description: 'Evaluator module items' },
      { type: 'Document', description: 'Uploaded files and attachments' }
    ]
  },
  
  fields: {
    timestamp: {
      name: 'Timestamp',
      label: 'Date/Time',
      type: 'datetime',
      description: 'When the action occurred',
      tips: 'Displayed in your local timezone'
    },
    user: {
      name: 'User',
      label: 'User',
      type: 'text',
      description: 'Who performed the action',
      tips: 'System actions show as "System"'
    },
    action: {
      name: 'Action',
      label: 'Action',
      type: 'select',
      description: 'Type of action performed',
      values: ['Create', 'Update', 'Delete', 'Submit', 'Approve', 'Reject', 'Login', 'Export'],
      tips: 'Describes what happened'
    },
    entity_type: {
      name: 'Entity Type',
      label: 'Entity Type',
      type: 'select',
      description: 'What type of item was affected',
      tips: 'Used for filtering'
    },
    entity_id: {
      name: 'Entity ID',
      label: 'ID',
      type: 'text',
      description: 'Specific item identifier',
      tips: 'Links to the actual item'
    },
    details: {
      name: 'Details',
      label: 'Change Details',
      type: 'json',
      description: 'What specifically changed',
      tips: 'Shows old → new values for updates'
    },
    ip_address: {
      name: 'IP Address',
      label: 'IP',
      type: 'text',
      description: 'Source IP address of the request',
      tips: 'Useful for security investigations'
    }
  },
  
  retention: {
    title: 'Audit Log Retention',
    description: 'How long audit logs are kept.',
    policy: [
      { period: '90 days', access: 'Full access in UI', description: 'All logs searchable and viewable' },
      { period: '1 year', access: 'Export available', description: 'Older logs can be exported' },
      { period: '7 years', access: 'Archive on request', description: 'Archived logs for compliance requests' }
    ],
    tips: [
      'Export important logs before 90-day window',
      'Contact support for archived logs',
      'Retention meets typical compliance requirements'
    ]
  },
  
  permissions: {
    admin: {
      role: 'Admin',
      canView: 'Full audit log',
      canFilter: true,
      canExport: true,
      canSearch: true,
      notes: 'Complete access to all audit data'
    },
    supplier_pm: {
      role: 'Supplier PM',
      canView: 'Project audit log',
      canFilter: true,
      canExport: true,
      canSearch: true,
      notes: 'Can see all project activity'
    },
    customer_pm: {
      role: 'Customer PM',
      canView: 'Limited - approvals and high-level',
      canFilter: true,
      canExport: false,
      canSearch: 'Limited',
      notes: 'Can see approval history and key actions'
    },
    contributor: {
      role: 'Contributor',
      canView: 'Own activity only',
      canFilter: false,
      canExport: false,
      canSearch: false,
      notes: 'Can see their own action history'
    },
    partner_admin: {
      role: 'Partner Admin',
      canView: 'Partner team activity',
      canFilter: true,
      canExport: false,
      canSearch: 'Partner data only',
      notes: 'Can see partner team actions'
    },
    partner_user: {
      role: 'Partner User',
      canView: 'Own activity only',
      canFilter: false,
      canExport: false,
      canSearch: false,
      notes: 'Limited to own history'
    }
  },
  
  faq: [
    {
      question: 'How far back does the audit log go?',
      answer: 'The searchable audit log goes back 90 days. Older logs up to 1 year can be exported. Archived logs beyond 1 year are available on request for compliance purposes.'
    },
    {
      question: 'Can I see who viewed a record?',
      answer: 'View actions are not tracked by default for performance reasons. Only changes (create, update, delete) and significant actions (approve, export) are logged.'
    },
    {
      question: 'What does "System" user mean?',
      answer: 'Actions performed automatically by the system (e.g., scheduled tasks, automatic status changes, integration syncs) appear with "System" as the user.'
    },
    {
      question: 'Can audit logs be deleted or modified?',
      answer: 'No, audit logs are immutable. They cannot be edited or deleted by any user, including Admins. This ensures integrity for compliance and investigations.'
    },
    {
      question: 'How do I find who changed a specific field?',
      answer: 'Filter by the entity ID, then look through Update actions. Expand each entry to see the change details which show old and new values for each modified field.'
    },
    {
      question: 'Why can\'t I see all the audit logs?',
      answer: 'Audit log visibility depends on your role. Contributors see only their own actions. PMs see project-level actions. Only Admins see the complete log.'
    },
    {
      question: 'Is IP address tracking reliable?',
      answer: 'IP addresses show where requests originated. Users on VPNs or corporate networks may show proxy IPs. Mobile users may show varying IPs. It\'s useful but not definitive.'
    },
    {
      question: 'How do I prove compliance with the audit log?',
      answer: 'Export the audit log for the relevant period. The export includes all actions, timestamps, and users. PDF format is suitable for official compliance documentation.'
    },
    {
      question: 'Can I set up alerts for specific actions?',
      answer: 'Yes, go to Admin → Project Settings → Notifications → Audit Alerts. You can configure alerts for specific action types or entities.'
    },
    {
      question: 'What timezone are timestamps in?',
      answer: 'Timestamps are stored in UTC and displayed in your local timezone based on your browser settings. Exports include both UTC and local time columns.'
    }
  ],
  
  related: ['organisation-admin', 'project-settings', 'team-members', 'roles-permissions']
};

export default auditLogGuide;
