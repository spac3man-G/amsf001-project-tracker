// Team Members Feature Guide
// Complete how-to documentation for project team management

const teamMembersGuide = {
  id: 'team-members',
  title: 'Team Members',
  category: 'admin',
  description: 'Manage project team members, assign roles, and control access to project features. Add team members from your organisation, set their project roles, and manage their permissions.',
  
  navigation: {
    path: '/admin/team',
    sidebar: 'Admin → Team Members',
    quickAccess: 'Project Menu → Team',
    breadcrumb: 'Home > Admin > Team Members'
  },
  
  howTo: {
    add: {
      title: 'Adding Team Members to a Project',
      steps: [
        'Navigate to Admin → Team Members',
        'Click "Add Team Member" button',
        'Search for the person by name or email',
        'Select from organisation members or enter new email',
        'Select their project role',
        'Set their start date on the project',
        'Add to any relevant groups or teams',
        'Click "Add to Project"'
      ],
      tips: [
        'Person must be in your organisation first',
        'For external people, invite to organisation first',
        'Role determines their permissions in this project',
        'Start date controls when they can access the project'
      ]
    },
    setRole: {
      title: 'Assigning Project Roles',
      steps: [
        'Navigate to Admin → Team Members',
        'Find the team member to update',
        'Click the role dropdown next to their name',
        'Select the new project role',
        'Confirm the role change',
        'Permissions update immediately'
      ],
      projectRoles: [
        {
          role: 'Admin',
          description: 'Full project access and configuration',
          keyPermissions: [
            'Access all project features',
            'Configure project settings',
            'Manage team members',
            'Approve all workflows',
            'View all financial data'
          ]
        },
        {
          role: 'Supplier PM',
          description: 'Manages project delivery for supplier side',
          keyPermissions: [
            'Manage timesheets and expenses',
            'Validate submissions',
            'Manage deliverables and milestones',
            'View all project data',
            'Cannot approve (customer role)'
          ]
        },
        {
          role: 'Customer PM',
          description: 'Oversees project for customer side',
          keyPermissions: [
            'Approve validated items',
            'Sign milestone certificates',
            'View all project data',
            'Cannot create or edit most items',
            'Final approval authority'
          ]
        },
        {
          role: 'Contributor',
          description: 'Team member who does project work',
          keyPermissions: [
            'Submit timesheets and expenses',
            'View assigned deliverables',
            'Update task status',
            'Cannot validate or approve',
            'Limited visibility to own work'
          ]
        },
        {
          role: 'Partner Admin',
          description: 'Manages partner team on the project',
          keyPermissions: [
            'Manage partner team timesheets',
            'Create partner invoices',
            'View partner-allocated work',
            'Cannot see other partner data'
          ]
        },
        {
          role: 'Partner User',
          description: 'Partner team member',
          keyPermissions: [
            'Submit own timesheets',
            'View assigned work',
            'Limited to partner scope',
            'Cannot see full project data'
          ]
        }
      ],
      tips: [
        'Match role to their actual responsibilities',
        'Use Contributor for most team members',
        'PM roles have management capabilities',
        'Admin should be limited to key people'
      ]
    },
    remove: {
      title: 'Removing Team Members from Project',
      steps: [
        'Navigate to Admin → Team Members',
        'Find the team member to remove',
        'Click the "..." menu next to their name',
        'Select "Remove from Project"',
        'Set their end date on the project',
        'Choose whether to reassign their work',
        'Confirm the removal',
        'They lose project access but data is preserved'
      ],
      removalOptions: [
        { option: 'Immediate', description: 'Remove access now, keep end date today' },
        { option: 'End Date', description: 'Set future date when access ends' },
        { option: 'Reassign', description: 'Transfer their assignments to another member' }
      ],
      tips: [
        'Consider reassigning work before removal',
        'Historical data (timesheets, etc.) remains',
        'Removed members can be re-added later',
        'They remain in the organisation'
      ]
    },
    viewTeam: {
      title: 'Viewing the Project Team',
      steps: [
        'Navigate to Admin → Team Members',
        'View all team members in the list',
        'Filter by: Role, Status, Partner',
        'Sort by name, role, or join date',
        'Click a member to see their profile',
        'View their activity and assignments'
      ],
      teamViews: [
        { view: 'List', description: 'Table of all team members' },
        { view: 'By Role', description: 'Grouped by project role' },
        { view: 'By Partner', description: 'Grouped by partner organisation' },
        { view: 'Org Chart', description: 'Visual team structure' }
      ],
      tips: [
        'Use filters to find specific members',
        'Export team list for reporting',
        'Review team regularly for accuracy'
      ]
    },
    manageGroups: {
      title: 'Managing Team Groups',
      steps: [
        'Navigate to Admin → Team Members → Groups',
        'View existing groups',
        'Click "Create Group" to add a new group',
        'Enter group name and description',
        'Add members to the group',
        'Set group permissions if applicable',
        'Save the group'
      ],
      groupUses: [
        'Notification distribution lists',
        'Workload and assignment grouping',
        'Reporting segments',
        'Access control for sensitive data'
      ],
      tips: [
        'Groups help organise large teams',
        'A member can be in multiple groups',
        'Groups don\'t replace roles for permissions'
      ]
    },
    bulkActions: {
      title: 'Bulk Team Management',
      steps: [
        'Navigate to Admin → Team Members',
        'Select multiple members using checkboxes',
        'Click "Bulk Actions" dropdown',
        'Choose action: Change Role, Add to Group, Remove',
        'Configure the action details',
        'Confirm the bulk change',
        'All selected members are updated'
      ],
      bulkActions: [
        { action: 'Change Role', description: 'Update role for multiple members' },
        { action: 'Add to Group', description: 'Add multiple members to a group' },
        { action: 'Remove from Group', description: 'Remove from a group' },
        { action: 'Export Selected', description: 'Export member details' }
      ],
      tips: [
        'Review selection carefully before bulk changes',
        'Bulk role changes are logged for audit',
        'Cannot bulk remove - must do individually'
      ]
    },
    viewMemberActivity: {
      title: 'Viewing Member Activity',
      steps: [
        'Navigate to Admin → Team Members',
        'Click on a team member\'s name',
        'View their profile and statistics',
        'See their recent activity',
        'View their assignments',
        'Check their timesheet and expense history'
      ],
      activityMetrics: [
        'Last active date',
        'Total hours logged',
        'Items submitted',
        'Approval rate',
        'Active assignments'
      ],
      tips: [
        'Use activity to identify inactive members',
        'Review workload distribution',
        'Identify bottlenecks in approvals'
      ]
    }
  },
  
  fields: {
    user_id: {
      name: 'User',
      label: 'Team Member',
      required: true,
      type: 'select',
      description: 'The person to add to the project',
      validation: 'Required. Must be an organisation member.',
      tips: 'Search by name or email'
    },
    role: {
      name: 'Role',
      label: 'Project Role',
      required: true,
      type: 'select',
      description: 'Their role and permissions in this project',
      values: ['Admin', 'Supplier PM', 'Customer PM', 'Contributor', 'Partner Admin', 'Partner User'],
      tips: 'Role determines what they can do'
    },
    start_date: {
      name: 'Start Date',
      label: 'Start Date',
      required: false,
      type: 'date',
      description: 'When they joined/join the project',
      tips: 'Access begins from this date'
    },
    end_date: {
      name: 'End Date',
      label: 'End Date',
      required: false,
      type: 'date',
      description: 'When they leave/left the project',
      tips: 'Access ends after this date'
    },
    partner_id: {
      name: 'Partner',
      label: 'Partner Organisation',
      required: false,
      type: 'select',
      description: 'Partner organisation if applicable',
      tips: 'Required for Partner Admin and Partner User roles'
    },
    groups: {
      name: 'Groups',
      label: 'Groups',
      required: false,
      type: 'multiselect',
      description: 'Groups this member belongs to',
      tips: 'Groups help with notifications and organisation'
    },
    status: {
      name: 'Status',
      label: 'Status',
      required: false,
      type: 'readonly',
      description: 'Current status on the project',
      values: ['Active', 'Inactive', 'Pending', 'Removed'],
      tips: 'Based on dates and activity'
    }
  },
  
  roleComparison: {
    title: 'Role Permissions Matrix',
    matrix: [
      { permission: 'Submit Timesheets', admin: '✓', supplierPM: '✓', customerPM: '✗', contributor: '✓', partnerAdmin: '✓', partnerUser: '✓' },
      { permission: 'Validate Timesheets', admin: '✓', supplierPM: '✓', customerPM: '✗', contributor: '✗', partnerAdmin: '✗', partnerUser: '✗' },
      { permission: 'Approve Timesheets', admin: '✓', supplierPM: '✗', customerPM: '✓', contributor: '✗', partnerAdmin: '✗', partnerUser: '✗' },
      { permission: 'View All Timesheets', admin: '✓', supplierPM: '✓', customerPM: '✓', contributor: '✗', partnerAdmin: 'Partner', partnerUser: '✗' },
      { permission: 'Manage Deliverables', admin: '✓', supplierPM: '✓', customerPM: '✗', contributor: '✗', partnerAdmin: '✗', partnerUser: '✗' },
      { permission: 'Sign Certificates', admin: '✓', supplierPM: '✗', customerPM: '✓', contributor: '✗', partnerAdmin: '✗', partnerUser: '✗' },
      { permission: 'View Financial Data', admin: '✓', supplierPM: '✓', customerPM: '✓', contributor: '✗', partnerAdmin: 'Partner', partnerUser: '✗' },
      { permission: 'Manage Team', admin: '✓', supplierPM: '✗', customerPM: '✗', contributor: '✗', partnerAdmin: '✗', partnerUser: '✗' },
      { permission: 'Project Settings', admin: '✓', supplierPM: 'Limited', customerPM: '✗', contributor: '✗', partnerAdmin: '✗', partnerUser: '✗' }
    ]
  },
  
  permissions: {
    admin: {
      role: 'Admin',
      canViewTeam: true,
      canAddMembers: true,
      canRemoveMembers: true,
      canChangeRoles: true,
      canManageGroups: true,
      notes: 'Full team management capabilities'
    },
    supplier_pm: {
      role: 'Supplier PM',
      canViewTeam: true,
      canAddMembers: false,
      canRemoveMembers: false,
      canChangeRoles: false,
      canManageGroups: false,
      notes: 'Can view team but not manage membership'
    },
    customer_pm: {
      role: 'Customer PM',
      canViewTeam: true,
      canAddMembers: false,
      canRemoveMembers: false,
      canChangeRoles: false,
      canManageGroups: false,
      notes: 'Can view team for oversight'
    },
    contributor: {
      role: 'Contributor',
      canViewTeam: 'Basic directory',
      canAddMembers: false,
      canRemoveMembers: false,
      canChangeRoles: false,
      canManageGroups: false,
      notes: 'Can see team directory for collaboration'
    },
    partner_admin: {
      role: 'Partner Admin',
      canViewTeam: 'Partner team only',
      canAddMembers: false,
      canRemoveMembers: false,
      canChangeRoles: false,
      canManageGroups: false,
      notes: 'Can see their partner team members'
    },
    partner_user: {
      role: 'Partner User',
      canViewTeam: 'Partner team only',
      canAddMembers: false,
      canRemoveMembers: false,
      canChangeRoles: false,
      canManageGroups: false,
      notes: 'Limited view of partner colleagues'
    }
  },
  
  faq: [
    {
      question: 'How do I add someone not in my organisation?',
      answer: 'First invite them to your organisation through Organisation Admin → Members → Invite. Once they accept, you can add them to projects.'
    },
    {
      question: 'What\'s the difference between organisation role and project role?',
      answer: 'Organisation role controls organisation-level access (settings, member management). Project role controls what someone can do within a specific project. They\'re independent.'
    },
    {
      question: 'Can someone have different roles on different projects?',
      answer: 'Yes, absolutely. Someone might be a Contributor on one project and a Supplier PM on another. Role is set per-project.'
    },
    {
      question: 'What happens to someone\'s data when I remove them?',
      answer: 'All their data (timesheets, expenses, activity) is preserved for audit and reporting. Only their access to the project is removed.'
    },
    {
      question: 'How do I transfer someone\'s work to another team member?',
      answer: 'Before removing them, go to their profile and use "Reassign Work". You can transfer their assignments, pending items, and ownership to another member.'
    },
    {
      question: 'Can I temporarily disable someone\'s access?',
      answer: 'Yes, set their status to Inactive or set an end date. They lose access but remain in the team list and can be reactivated.'
    },
    {
      question: 'How many Admins should a project have?',
      answer: 'At least two to ensure continuity. Too many Admins can cause confusion about ownership. Most team members should be Contributors.'
    },
    {
      question: 'What\'s the Partner User role for?',
      answer: 'Partner Users are team members from partner organisations. They can submit their own timesheets but have limited visibility to protect commercial confidentiality.'
    },
    {
      question: 'Can I see what a team member has access to?',
      answer: 'Yes, click on their name to see their profile. The Permissions tab shows exactly what they can and cannot do based on their role.'
    },
    {
      question: 'How do I notify the whole team?',
      answer: 'Create a group containing all team members, then use the notification feature to message the group. Or use the Announcements feature on the dashboard.'
    }
  ],
  
  related: ['organisation-admin', 'project-settings', 'roles-permissions', 'resources']
};

export default teamMembersGuide;
