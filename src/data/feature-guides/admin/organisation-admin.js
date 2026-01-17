// Organisation Admin Feature Guide
// Complete how-to documentation for organisation management

const organisationAdminGuide = {
  id: 'organisation-admin',
  title: 'Organisation Administration',
  category: 'admin',
  description: 'Manage your organisation settings, members, and structure. Create and configure organisations, invite members, assign roles, and manage organisation-wide settings.',
  
  navigation: {
    path: '/admin/organisation',
    sidebar: 'Admin → Organisation',
    quickAccess: 'User Menu → Organisation Settings',
    breadcrumb: 'Home > Admin > Organisation'
  },
  
  howTo: {
    create: {
      title: 'Creating an Organisation',
      steps: [
        'Click your user menu in the top right',
        'Select "Create Organisation"',
        'Enter the organisation name',
        'Enter a unique organisation slug (URL identifier)',
        'Add an optional description',
        'Upload the organisation logo (optional)',
        'Select the organisation type: Client, Supplier, or Partner',
        'Click "Create Organisation"',
        'You become the Organisation Admin automatically'
      ],
      tips: [
        'Organisation name should match your legal entity',
        'Slug is used in URLs - keep it short and memorable',
        'You can be a member of multiple organisations',
        'Logo appears on reports and dashboards'
      ]
    },
    invite: {
      title: 'Inviting Members to Organisation',
      steps: [
        'Navigate to Admin → Organisation → Members',
        'Click "Invite Member" button',
        'Enter the person\'s email address',
        'Select their organisation role: Admin, Member, or Viewer',
        'Add an optional welcome message',
        'Click "Send Invitation"',
        'Invitee receives email with join link',
        'Track invitation status in the Members list'
      ],
      invitationStatuses: [
        { status: 'Pending', description: 'Invitation sent, awaiting response' },
        { status: 'Accepted', description: 'User has joined the organisation' },
        { status: 'Expired', description: 'Invitation expired (7 days)' },
        { status: 'Revoked', description: 'Invitation cancelled by admin' }
      ],
      tips: [
        'Use work email addresses for security',
        'Resend invitations if expired',
        'New members get email notification',
        'You can revoke pending invitations'
      ]
    },
    manageRoles: {
      title: 'Managing Organisation Roles',
      steps: [
        'Navigate to Admin → Organisation → Members',
        'Find the member you want to update',
        'Click the role dropdown next to their name',
        'Select the new role: Admin, Member, or Viewer',
        'Confirm the role change',
        'Member receives notification of role change'
      ],
      organisationRoles: [
        {
          role: 'Organisation Admin',
          description: 'Full control over organisation settings and members',
          permissions: [
            'Manage organisation settings',
            'Invite and remove members',
            'Change member roles',
            'Create and manage projects',
            'View all organisation data',
            'Manage billing and subscription'
          ]
        },
        {
          role: 'Member',
          description: 'Standard organisation member',
          permissions: [
            'View organisation details',
            'Access assigned projects',
            'Cannot invite new members',
            'Cannot change organisation settings'
          ]
        },
        {
          role: 'Viewer',
          description: 'Read-only access to organisation',
          permissions: [
            'View organisation details',
            'View assigned projects (read-only)',
            'Cannot modify any data'
          ]
        }
      ],
      tips: [
        'Have at least two Organisation Admins for continuity',
        'Use Viewer role for external stakeholders',
        'Role changes take effect immediately'
      ]
    },
    settings: {
      title: 'Configuring Organisation Settings',
      steps: [
        'Navigate to Admin → Organisation → Settings',
        'Update organisation details: name, description, logo',
        'Configure default settings for new projects',
        'Set up notification preferences',
        'Configure security settings',
        'Set up integrations if available',
        'Click "Save Settings" to apply changes'
      ],
      settingsCategories: [
        { category: 'General', settings: ['Name', 'Description', 'Logo', 'Contact details'] },
        { category: 'Defaults', settings: ['Default project settings', 'Default roles', 'Default workflows'] },
        { category: 'Notifications', settings: ['Email preferences', 'Digest frequency'] },
        { category: 'Security', settings: ['Password policy', 'Session timeout', '2FA requirements'] },
        { category: 'Integrations', settings: ['API access', 'Connected services'] }
      ],
      tips: [
        'Set sensible defaults to save time on new projects',
        'Review security settings regularly',
        'Logo should be square format for best display'
      ]
    },
    remove: {
      title: 'Removing Members from Organisation',
      steps: [
        'Navigate to Admin → Organisation → Members',
        'Find the member to remove',
        'Click the "..." menu next to their name',
        'Select "Remove from Organisation"',
        'Confirm the removal',
        'Member loses access to all organisation projects',
        'Their data (timesheets, etc.) is preserved'
      ],
      tips: [
        'Removal is immediate - member loses access instantly',
        'Consider reassigning their work first',
        'You cannot remove the last Organisation Admin',
        'Removed members can be re-invited later'
      ]
    },
    switchOrganisation: {
      title: 'Switching Between Organisations',
      steps: [
        'Click your user menu in the top right',
        'Your current organisation is shown',
        'Click "Switch Organisation"',
        'Select the organisation you want to access',
        'The interface updates to show that organisation\'s data',
        'Your role may differ between organisations'
      ],
      tips: [
        'Each organisation has separate projects and data',
        'Your role is set per-organisation',
        'Recently accessed organisations appear first'
      ]
    },
    viewActivity: {
      title: 'Viewing Organisation Activity',
      steps: [
        'Navigate to Admin → Organisation → Activity',
        'View recent activity across the organisation',
        'Filter by: Action type, User, Date range',
        'Click any activity for details',
        'Export activity log if needed'
      ],
      trackedActivities: [
        'Member invitations and joins',
        'Role changes',
        'Settings modifications',
        'Project creation',
        'Security events'
      ],
      tips: [
        'Review activity regularly for security',
        'Export logs for compliance requirements',
        'Unusual activity may indicate security issues'
      ]
    },
    viewPortfolioInsights: {
      title: 'Viewing Portfolio Insights (AI)',
      steps: [
        'Navigate to Admin → Organisation',
        'Click the "Insights" tab',
        'View the portfolio health score (0-100) and executive summary',
        'Review key metrics: active projects, budget utilization, on-track percentage',
        'Check "Projects Needing Attention" for items requiring intervention',
        'Expand "Risk Patterns" to see common issues across projects',
        'Review "Strategic Recommendations" for portfolio-level actions',
        'Click refresh to update the analysis'
      ],
      metricsExplained: [
        { metric: 'Portfolio Health Score', description: 'Overall health of all projects (0-100)' },
        { metric: 'Active Projects', description: 'Number of currently active projects' },
        { metric: 'Budget Utilization', description: 'Percentage of total budget spent' },
        { metric: 'On-Track Percentage', description: 'Percentage of projects on schedule' }
      ],
      tips: [
        'Portfolio Insights is only available to Organisation Admins',
        'Analysis covers all projects in your organisation',
        'Projects needing attention are prioritised by urgency',
        'Risk patterns identify systemic issues affecting multiple projects',
        'AI recommendations are advisory - always apply business context',
        'Use insights for strategic planning and resource allocation'
      ]
    }
  },

  fields: {
    name: {
      name: 'Organisation Name',
      label: 'Name',
      required: true,
      type: 'text',
      description: 'The display name for your organisation',
      validation: 'Required. Maximum 200 characters.',
      tips: 'Use your legal or trading name'
    },
    slug: {
      name: 'Slug',
      label: 'URL Slug',
      required: true,
      type: 'text',
      description: 'Unique identifier used in URLs',
      validation: 'Required. Lowercase letters, numbers, hyphens only.',
      tips: 'Cannot be changed after creation'
    },
    description: {
      name: 'Description',
      label: 'Description',
      required: false,
      type: 'textarea',
      description: 'Brief description of the organisation',
      validation: 'Maximum 1000 characters.',
      tips: 'Helps members identify the right organisation'
    },
    logo: {
      name: 'Logo',
      label: 'Organisation Logo',
      required: false,
      type: 'image',
      description: 'Logo displayed on dashboards and reports',
      validation: 'PNG or JPG. Recommended 200x200 pixels.',
      tips: 'Square format works best'
    },
    type: {
      name: 'Type',
      label: 'Organisation Type',
      required: true,
      type: 'select',
      description: 'The type of organisation',
      values: ['Client', 'Supplier', 'Partner'],
      tips: 'Affects available features and defaults'
    },
    member_email: {
      name: 'Email',
      label: 'Email Address',
      required: true,
      type: 'email',
      description: 'Email address to send invitation',
      validation: 'Required. Must be valid email.',
      tips: 'Use work email addresses'
    },
    member_role: {
      name: 'Role',
      label: 'Organisation Role',
      required: true,
      type: 'select',
      description: 'Role within the organisation',
      values: ['Admin', 'Member', 'Viewer'],
      tips: 'Can be changed after joining'
    }
  },
  
  permissions: {
    org_admin: {
      role: 'Organisation Admin',
      canViewSettings: true,
      canEditSettings: true,
      canInviteMembers: true,
      canRemoveMembers: true,
      canChangeRoles: true,
      canCreateProjects: true,
      canDeleteOrganisation: true,
      canViewPortfolioInsights: true,
      notes: 'Full control over the organisation, including AI Portfolio Insights'
    },
    org_member: {
      role: 'Organisation Member',
      canViewSettings: true,
      canEditSettings: false,
      canInviteMembers: false,
      canRemoveMembers: false,
      canChangeRoles: false,
      canCreateProjects: false,
      canDeleteOrganisation: false,
      canViewPortfolioInsights: false,
      notes: 'Can access assigned projects only'
    },
    org_viewer: {
      role: 'Organisation Viewer',
      canViewSettings: 'Limited',
      canEditSettings: false,
      canInviteMembers: false,
      canRemoveMembers: false,
      canChangeRoles: false,
      canCreateProjects: false,
      canDeleteOrganisation: false,
      canViewPortfolioInsights: false,
      notes: 'Read-only access to organisation'
    }
  },
  
  faq: [
    {
      question: 'Can I belong to multiple organisations?',
      answer: 'Yes, you can be a member of multiple organisations. Use the Switch Organisation feature to move between them. You may have different roles in each organisation.'
    },
    {
      question: 'How do I transfer organisation ownership?',
      answer: 'Make another user an Organisation Admin first. Then they can remove your Admin role if needed. There must always be at least one Organisation Admin.'
    },
    {
      question: 'What happens when I remove a member?',
      answer: 'They immediately lose access to all organisation projects. Their historical data (timesheets, expenses, etc.) is preserved for audit purposes.'
    },
    {
      question: 'Can I change the organisation slug?',
      answer: 'No, the slug cannot be changed after creation as it\'s used in URLs and integrations. Choose carefully during setup.'
    },
    {
      question: 'How do I delete an organisation?',
      answer: 'Organisation deletion requires Organisation Admin access and can only be done when there are no active projects. Contact support for assistance with deletion.'
    },
    {
      question: 'What\'s the difference between organisation roles and project roles?',
      answer: 'Organisation roles control access to organisation settings and member management. Project roles control what you can do within specific projects. They are separate.'
    },
    {
      question: 'How many members can I invite?',
      answer: 'Member limits depend on your subscription plan. Check your plan details or contact support for upgrade options.'
    },
    {
      question: 'Can I see which projects a member has access to?',
      answer: 'Yes, view the member\'s profile to see their project assignments. As Organisation Admin, you can see all member-project relationships.'
    },
    {
      question: 'What is Portfolio Insights?',
      answer: 'Portfolio Insights is an AI-powered analysis of all projects in your organisation. It shows overall portfolio health, identifies projects needing attention, detects risk patterns across projects, and provides strategic recommendations. Access it via the Insights tab in Organisation Admin.'
    },
    {
      question: 'Why can I not see the Insights tab?',
      answer: 'The Insights tab and Portfolio Insights feature are only available to Organisation Admins. If you do not have the Organisation Admin role, this tab will not appear.'
    },
    {
      question: 'How accurate are the Portfolio Insights recommendations?',
      answer: 'Portfolio Insights uses AI to analyse project data and identify patterns. Recommendations are based on current data and trends. They are advisory only - always apply your business context and judgement when making decisions.'
    }
  ],

  related: ['project-settings', 'team-members', 'audit-log', 'roles-permissions', 'ai-intelligence']
};

export default organisationAdminGuide;
