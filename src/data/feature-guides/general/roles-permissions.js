// Roles and Permissions Feature Guide
// Complete how-to documentation for understanding system roles and permissions

const rolesPermissionsGuide = {
  id: 'roles-permissions',
  title: 'Roles & Permissions',
  category: 'general',
  description: 'Understand the role-based access control system. Learn what each role can do, how permissions work, and how roles interact between organisation and project levels.',
  
  navigation: {
    path: '/help/roles',
    sidebar: 'Help → Roles & Permissions',
    quickAccess: 'User Menu → My Permissions',
    breadcrumb: 'Home > Help > Roles & Permissions'
  },
  
  overview: {
    title: 'Understanding Roles',
    description: 'The system uses role-based access control (RBAC) at two levels: organisation and project.',
    levels: [
      {
        level: 'Organisation Roles',
        description: 'Control access to organisation settings and member management',
        roles: ['Organisation Admin', 'Member', 'Viewer']
      },
      {
        level: 'Project Roles',
        description: 'Control what you can do within a specific project',
        roles: ['Admin', 'Supplier PM', 'Customer PM', 'Contributor', 'Partner Admin', 'Partner User']
      }
    ],
    keyPrinciples: [
      'You can have different roles in different projects',
      'Organisation role and project role are independent',
      'Permissions are additive - you get all permissions of your role',
      'Restrictions are enforced - you cannot exceed your role\'s permissions'
    ]
  },
  
  organisationRoles: {
    title: 'Organisation Roles',
    roles: [
      {
        role: 'Organisation Admin',
        description: 'Full control over the organisation',
        permissions: [
          'Manage organisation settings (name, logo, etc.)',
          'Invite and remove organisation members',
          'Change member organisation roles',
          'Create new projects',
          'View all organisation activity',
          'Manage billing and subscription',
          'Delete the organisation (requires confirmation)'
        ],
        whoGetsThis: 'Organisation owners, senior managers',
        tips: 'Have at least two Org Admins for continuity'
      },
      {
        role: 'Member',
        description: 'Standard organisation member',
        permissions: [
          'View organisation details',
          'Access projects they\'re assigned to',
          'View organisation member directory',
          'Update own profile'
        ],
        cannotDo: [
          'Change organisation settings',
          'Invite or remove members',
          'Create new projects',
          'Access projects not assigned'
        ],
        whoGetsThis: 'Most users, team members',
        tips: 'Default role for new members'
      },
      {
        role: 'Viewer',
        description: 'Read-only organisation access',
        permissions: [
          'View organisation details',
          'View assigned project summaries (read-only)',
          'View own profile'
        ],
        cannotDo: [
          'Modify any organisation data',
          'Create or submit items',
          'Access detailed project data'
        ],
        whoGetsThis: 'External stakeholders, auditors, observers',
        tips: 'Use for people who need visibility but not participation'
      }
    ]
  },
  
  projectRoles: {
    title: 'Project Roles',
    roles: [
      {
        role: 'Admin',
        description: 'Full project control and configuration',
        permissions: [
          'Access all project features',
          'Configure project settings',
          'Manage team members and roles',
          'Create and manage milestones, deliverables',
          'Validate and approve all items',
          'View all financial data',
          'Export any data',
          'Manage integrations'
        ],
        cannotDo: 'Nothing project-related is restricted',
        whoGetsThis: 'Project leads, PMO, project owners',
        tips: 'Limit Admin count - most users should be Contributors'
      },
      {
        role: 'Supplier PM',
        description: 'Manages project delivery on supplier side',
        permissions: [
          'Create and manage timesheets, expenses',
          'Validate submitted timesheets and expenses',
          'Manage deliverables and milestones',
          'Manage resources and assignments',
          'Create and manage RAID items, variations',
          'View all project data',
          'Create partner invoices'
        ],
        cannotDo: [
          'Give final approval (Customer PM role)',
          'Sign milestone certificates',
          'Manage team members (Admin role)',
          'Configure project settings'
        ],
        whoGetsThis: 'Delivery managers, project managers (supplier side)',
        tips: 'Key role for day-to-day project management'
      },
      {
        role: 'Customer PM',
        description: 'Oversees project on customer/client side',
        permissions: [
          'View all project data',
          'Approve validated timesheets and expenses',
          'Sign milestone certificates',
          'Reject items back for revision',
          'View financial summaries'
        ],
        cannotDo: [
          'Create or edit timesheets, expenses',
          'Validate items (Supplier PM role)',
          'Manage deliverables or milestones',
          'Change project settings'
        ],
        whoGetsThis: 'Client project managers, customer stakeholders',
        tips: 'Approval authority - ensures customer sign-off'
      },
      {
        role: 'Contributor',
        description: 'Team member who does project work',
        permissions: [
          'Submit own timesheets',
          'Submit own expense claims',
          'View own submissions and history',
          'View assigned deliverables and tasks',
          'Update status of assigned tasks',
          'View project milestones and timeline'
        ],
        cannotDo: [
          'View other people\'s timesheets/expenses',
          'Validate or approve anything',
          'Create or manage milestones/deliverables',
          'View detailed financial data',
          'Change project settings'
        ],
        whoGetsThis: 'Developers, analysts, team members doing the work',
        tips: 'Most team members should be Contributors'
      },
      {
        role: 'Partner Admin',
        description: 'Manages partner organisation\'s team on the project',
        permissions: [
          'View partner-allocated work',
          'Submit and manage partner team timesheets',
          'Create and submit partner invoices',
          'View partner team members',
          'View partner financial data'
        ],
        cannotDo: [
          'See other partners\' data',
          'See main project financials',
          'Validate or approve items',
          'Access non-partner deliverables'
        ],
        whoGetsThis: 'Partner company managers, subcontractor leads',
        tips: 'Maintains commercial confidentiality between partners'
      },
      {
        role: 'Partner User',
        description: 'Partner team member',
        permissions: [
          'Submit own timesheets',
          'View own submissions',
          'View assigned work',
          'View own partner colleagues'
        ],
        cannotDo: [
          'See full project scope',
          'See other partner team data',
          'See any financial data',
          'Submit partner invoices'
        ],
        whoGetsThis: 'Partner company team members, subcontractor staff',
        tips: 'Limited view protects commercial information'
      }
    ]
  },
  
  permissionMatrix: {
    title: 'Quick Permission Reference',
    categories: [
      {
        category: 'Timesheets',
        permissions: [
          { action: 'View Own', admin: '✓', supplierPM: '✓', customerPM: '✗', contributor: '✓', partnerAdmin: '✓', partnerUser: '✓' },
          { action: 'View All', admin: '✓', supplierPM: '✓', customerPM: '✓', contributor: '✗', partnerAdmin: 'Partner', partnerUser: '✗' },
          { action: 'Create', admin: '✓', supplierPM: '✓', customerPM: '✗', contributor: '✓', partnerAdmin: '✓', partnerUser: '✓' },
          { action: 'Validate', admin: '✓', supplierPM: '✓', customerPM: '✗', contributor: '✗', partnerAdmin: '✗', partnerUser: '✗' },
          { action: 'Approve', admin: '✓', supplierPM: '✗', customerPM: '✓', contributor: '✗', partnerAdmin: '✗', partnerUser: '✗' }
        ]
      },
      {
        category: 'Expenses',
        permissions: [
          { action: 'View Own', admin: '✓', supplierPM: '✓', customerPM: '✗', contributor: '✓', partnerAdmin: '✓', partnerUser: '✓' },
          { action: 'View All', admin: '✓', supplierPM: '✓', customerPM: '✓', contributor: '✗', partnerAdmin: 'Partner', partnerUser: '✗' },
          { action: 'Create', admin: '✓', supplierPM: '✓', customerPM: '✗', contributor: '✓', partnerAdmin: '✓', partnerUser: '✓' },
          { action: 'Validate', admin: '✓', supplierPM: '✓', customerPM: '✗', contributor: '✗', partnerAdmin: '✗', partnerUser: '✗' },
          { action: 'Approve', admin: '✓', supplierPM: '✗', customerPM: '✓', contributor: '✗', partnerAdmin: '✗', partnerUser: '✗' }
        ]
      },
      {
        category: 'Milestones & Deliverables',
        permissions: [
          { action: 'View', admin: '✓', supplierPM: '✓', customerPM: '✓', contributor: 'Assigned', partnerAdmin: 'Assigned', partnerUser: 'Assigned' },
          { action: 'Create', admin: '✓', supplierPM: '✓', customerPM: '✗', contributor: '✗', partnerAdmin: '✗', partnerUser: '✗' },
          { action: 'Edit', admin: '✓', supplierPM: '✓', customerPM: '✗', contributor: '✗', partnerAdmin: '✗', partnerUser: '✗' },
          { action: 'Sign Certificate', admin: '✓', supplierPM: '✗', customerPM: '✓', contributor: '✗', partnerAdmin: '✗', partnerUser: '✗' }
        ]
      },
      {
        category: 'Financial Data',
        permissions: [
          { action: 'View Budgets', admin: '✓', supplierPM: '✓', customerPM: '✓', contributor: '✗', partnerAdmin: 'Partner', partnerUser: '✗' },
          { action: 'View Rates', admin: '✓', supplierPM: '✓', customerPM: 'Summary', contributor: '✗', partnerAdmin: '✗', partnerUser: '✗' },
          { action: 'Manage Invoices', admin: '✓', supplierPM: '✓', customerPM: '✗', contributor: '✗', partnerAdmin: 'Partner', partnerUser: '✗' }
        ]
      },
      {
        category: 'Administration',
        permissions: [
          { action: 'Project Settings', admin: '✓', supplierPM: 'Limited', customerPM: '✗', contributor: '✗', partnerAdmin: '✗', partnerUser: '✗' },
          { action: 'Team Management', admin: '✓', supplierPM: '✗', customerPM: '✗', contributor: '✗', partnerAdmin: '✗', partnerUser: '✗' },
          { action: 'Audit Log', admin: '✓', supplierPM: '✓', customerPM: 'Limited', contributor: 'Own', partnerAdmin: 'Partner', partnerUser: 'Own' }
        ]
      }
    ]
  },
  
  howTo: {
    checkPermissions: {
      title: 'Checking Your Permissions',
      steps: [
        'Click your user menu (profile icon) in the header',
        'Select "My Permissions"',
        'View your organisation role',
        'View your role in the current project',
        'See a list of what you can and cannot do',
        'Check other projects using the project selector'
      ],
      tips: [
        'Permissions are set per-project',
        'Contact Admin if you need different access',
        'Role determines all your permissions'
      ]
    },
    requestAccess: {
      title: 'Requesting Additional Access',
      steps: [
        'Identify what access you need',
        'Contact a Project Admin or Organisation Admin',
        'Explain why you need the access',
        'Admin can change your role or add you to the project',
        'You\'ll receive notification when access is granted'
      ],
      tips: [
        'Be specific about what you need to do',
        'Admins can view your current permissions',
        'Role changes take effect immediately'
      ]
    }
  },
  
  dataVisibility: {
    title: 'What Each Role Can See',
    description: 'Beyond actions, roles also control what data is visible.',
    visibility: [
      {
        role: 'Admin / Supplier PM',
        sees: [
          'All timesheets and expenses',
          'All resources and their rates',
          'Full financial data',
          'All RAID items and variations',
          'Complete audit log',
          'All team member details'
        ]
      },
      {
        role: 'Customer PM',
        sees: [
          'All timesheets and expenses (totals, not rates)',
          'Resource names (not rates)',
          'Budget summaries',
          'All RAID items and variations',
          'Approval history'
        ]
      },
      {
        role: 'Contributor',
        sees: [
          'Own timesheets and expenses',
          'Assigned deliverables and tasks',
          'Project milestones and timeline',
          'Team directory (names only)',
          'Own activity history'
        ]
      },
      {
        role: 'Partner Roles',
        sees: [
          'Own/partner team data only',
          'Partner-allocated deliverables',
          'Partner invoices',
          'Limited project overview'
        ]
      }
    ]
  },
  
  faq: [
    {
      question: 'Why can\'t I see the Finance section?',
      answer: 'The Finance section is only visible to Admin, Supplier PM, and Customer PM roles. Contributors and Partner Users don\'t have access to financial data to protect commercial confidentiality.'
    },
    {
      question: 'Can I have different roles on different projects?',
      answer: 'Yes, your role is set independently for each project. You might be a Supplier PM on one project and a Contributor on another. Your permissions in each project match your role there.'
    },
    {
      question: 'What\'s the difference between Validate and Approve?',
      answer: 'Validate is the first check done by Supplier PM - confirming the data is correct. Approve is the final sign-off by Customer PM - authorising for billing. Both steps are required.'
    },
    {
      question: 'How do I become an Admin?',
      answer: 'Project roles are assigned by existing Admins. Contact your Project Admin to request a role change. Organisation Admin role is assigned by Organisation Admins.'
    },
    {
      question: 'Why can partners only see some data?',
      answer: 'Partner visibility is limited to protect commercial confidentiality. Partners shouldn\'t see other partners\' data, resource rates, or full financial details.'
    },
    {
      question: 'Can I see who has what role?',
      answer: 'Admins can see all team members and their roles. Other roles can see the team directory but role details depend on your own permissions.'
    },
    {
      question: 'What happens if I need to do something outside my role?',
      answer: 'Contact a Project Admin. They can either perform the action for you, temporarily change your role, or explain why the access isn\'t appropriate.'
    },
    {
      question: 'Do permissions affect the AI assistant?',
      answer: 'Yes, the AI assistant respects your permissions. It can only access and report on data you\'re allowed to see based on your role.'
    }
  ],
  
  related: ['team-members', 'organisation-admin', 'navigation', 'workflows']
};

export default rolesPermissionsGuide;
