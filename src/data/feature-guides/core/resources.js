// Resource Feature Guide
// Complete how-to documentation for resource/team member functionality

const resourcesGuide = {
  id: 'resources',
  title: 'Resources',
  category: 'core',
  description: 'Resources represent team members working on the project. They can be linked to user accounts for login access, assigned to partners, and configured with day rates for billing. Resources submit timesheets and expenses, and can be assigned to deliverables and tasks.',
  
  navigation: {
    path: '/resources',
    sidebar: 'Team → Resources',
    quickAccess: 'Dashboard → Team Overview widget',
    breadcrumb: 'Home > Team > Resources'
  },
  
  howTo: {
    add: {
      title: 'Adding a Team Member (Resource)',
      steps: [
        'Navigate to the Resources page from the sidebar (Team → Resources)',
        'Click the "Add Resource" button in the top right corner',
        'Enter the person\'s full name',
        'Enter their email address',
        'Select their project role (Contributor, Supplier PM, etc.)',
        'Optionally link to an existing user account',
        'Optionally assign to a partner organisation',
        'Click "Save" to add the resource'
      ],
      tips: [
        'Email must be unique within the project',
        'Linking to a user account enables them to log in and access the project',
        'Role determines their permissions in the project',
        'Partner assignment affects visibility and invoicing',
        'Day rates can be configured after creation'
      ],
      videoUrl: null
    },
    edit: {
      title: 'Editing a Resource',
      steps: [
        'Navigate to the Resources page',
        'Find the resource you want to edit',
        'Click the edit icon (pencil) or click the row to open details',
        'Modify name, email, role, or other fields',
        'Click "Save" to apply changes'
      ],
      tips: [
        'Changing role affects permissions immediately',
        'Email changes may affect user account linking',
        'Historical timesheet data is preserved when editing'
      ]
    },
    linkUser: {
      title: 'Linking a Resource to a User Account',
      steps: [
        'Open the resource details page',
        'Find the "User Account" section',
        'Click "Link User" button',
        'Search for an existing user by email, or invite a new user',
        'Select the user to link',
        'Confirm the linking',
        'The resource is now connected to that user account'
      ],
      tips: [
        'Linked users can log in and access the project',
        'The user inherits the resource\'s project role',
        'One user can be linked to resources in multiple projects',
        'Unlinking removes project access but preserves data',
        'Inviting a new user sends them an email invitation'
      ]
    },
    inviteUser: {
      title: 'Inviting a New User',
      steps: [
        'From the resource details, click "Invite User"',
        'Enter the person\'s email address',
        'Optionally customise the invitation message',
        'Click "Send Invitation"',
        'The person receives an email to create their account',
        'Once they accept, they are automatically linked to this resource'
      ],
      tips: [
        'Invitations expire after 7 days',
        'You can resend invitations if needed',
        'The invited user will see this project upon login',
        'Their role is set by the resource configuration'
      ]
    },
    setRates: {
      title: 'Configuring Day Rates',
      steps: [
        'Open the resource details page',
        'Click the "Rates" tab',
        'Click "Add Rate" or edit existing rates',
        'Select the rate tier (Prime, Contractor, Mid, SME)',
        'Enter the day rate amount',
        'Set the effective date for this rate',
        'Click "Save" to apply the rate'
      ],
      tips: [
        'Rates are used to calculate actual spend from timesheets',
        'Multiple rates can exist with different effective dates',
        'The system uses the rate active on the timesheet date',
        'Rate tiers align with benchmarking data',
        'PM and Admin roles can view all rates; others see limited info'
      ]
    },
    assignPartner: {
      title: 'Assigning a Resource to a Partner',
      steps: [
        'Open the resource details page',
        'Find the "Partner" field',
        'Click to select a partner organisation',
        'Choose from the available partners in the project',
        'Save the changes',
        'The resource is now associated with that partner'
      ],
      tips: [
        'Partner resources are visible to Partner Admins of that partner',
        'Partner assignment affects invoicing and cost tracking',
        'Resources without a partner are considered prime team',
        'Partner Admins can only see resources in their partner'
      ]
    },
    viewAllocation: {
      title: 'Viewing Resource Allocation',
      steps: [
        'Navigate to the Resources page',
        'Click on a resource to open details',
        'View the "Allocation" tab',
        'See the breakdown of planned vs actual hours',
        'View allocation by milestone or deliverable',
        'Check availability for future planning'
      ],
      tips: [
        'Allocation shows how time is distributed across work items',
        'Compare planned estimates with actual timesheets',
        'Use this for capacity planning',
        'Over-allocated resources are flagged'
      ]
    },
    view: {
      title: 'Viewing Resources',
      steps: [
        'Navigate to the Resources page from the sidebar',
        'View the list showing name, role, partner, and linked status',
        'Use filters to show specific roles or partners',
        'Use search to find resources by name or email',
        'Click on any resource to see full details'
      ],
      tips: [
        'Linked status shows whether the resource has login access',
        'Role badges indicate project permissions',
        'Partner column shows organisation affiliation',
        'Export to CSV for team reporting'
      ]
    },
    remove: {
      title: 'Removing a Resource from the Project',
      steps: [
        'Navigate to the Resources page',
        'Find the resource to remove',
        'Click the delete icon or open details and click "Remove"',
        'Confirm the removal',
        'The resource is removed from the project'
      ],
      tips: [
        'Resources with approved timesheets cannot be deleted',
        'Removing a resource revokes their project access',
        'Historical data is preserved for audit',
        'Consider deactivating instead of deleting if unsure'
      ]
    }
  },
  
  fields: {
    name: {
      name: 'Name',
      label: 'Full Name',
      required: true,
      type: 'text',
      description: 'The person\'s full name',
      validation: 'Required. Maximum 200 characters.',
      tips: 'Use their preferred name for display.'
    },
    email: {
      name: 'Email',
      label: 'Email Address',
      required: true,
      type: 'email',
      description: 'The person\'s email address',
      validation: 'Must be a valid email format. Must be unique in the project.',
      tips: 'Used for notifications and user account linking.'
    },
    role: {
      name: 'Role',
      label: 'Project Role',
      required: true,
      type: 'select',
      description: 'The person\'s role in this project',
      values: ['Contributor', 'Supplier PM', 'Customer PM', 'Admin', 'Partner Admin', 'Partner User'],
      tips: 'Role determines permissions. See Roles & Permissions guide for details.'
    },
    user_id: {
      name: 'Linked User',
      label: 'User Account',
      required: false,
      type: 'reference',
      description: 'The user account linked to this resource',
      tips: 'Link to enable login access. Can be linked later.'
    },
    partner_id: {
      name: 'Partner',
      label: 'Partner Organisation',
      required: false,
      type: 'select',
      description: 'The partner organisation this resource belongs to',
      tips: 'Leave blank for prime team members. Partner resources have separate visibility rules.'
    },
    day_rate: {
      name: 'Day Rate',
      label: 'Day Rate',
      required: false,
      type: 'currency',
      description: 'The daily rate used for billing calculations',
      tips: 'Set in the Rates tab. Can have multiple rates with different effective dates.'
    },
    rate_tier: {
      name: 'Rate Tier',
      label: 'Rate Tier',
      required: false,
      type: 'select',
      description: 'The pricing tier for benchmarking',
      values: ['Prime', 'Contractor', 'Mid', 'SME'],
      tips: 'Aligns with benchmarking rate cards for comparison.'
    },
    status: {
      name: 'Status',
      label: 'Status',
      required: true,
      type: 'select',
      description: 'Whether the resource is active on the project',
      values: ['Active', 'Inactive'],
      tips: 'Inactive resources cannot log time but historical data is preserved.'
    },
    availability: {
      name: 'Availability',
      label: 'Availability',
      required: false,
      type: 'percentage',
      description: 'Percentage of time allocated to this project',
      tips: 'Used for capacity planning. 100% means full-time on this project.',
      default: 100
    }
  },
  
  permissions: {
    contributor: {
      role: 'Contributor',
      canView: 'Own resource only',
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canLinkUser: false,
      canSetRates: false,
      canViewRates: 'Own rate only',
      notes: 'Contributors can only see their own resource record'
    },
    supplier_pm: {
      role: 'Supplier PM',
      canView: 'All resources in project',
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canLinkUser: true,
      canSetRates: true,
      canViewRates: true,
      notes: 'Supplier PMs manage the team and rates'
    },
    customer_pm: {
      role: 'Customer PM',
      canView: 'All resources (names and roles)',
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canLinkUser: false,
      canSetRates: false,
      canViewRates: false,
      notes: 'Customer PMs see team composition but not rates'
    },
    admin: {
      role: 'Admin',
      canView: 'All resources in project',
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canLinkUser: true,
      canSetRates: true,
      canViewRates: true,
      notes: 'Admins have full access to resource management'
    },
    partner_admin: {
      role: 'Partner Admin',
      canView: 'Own partner resources only',
      canCreate: 'Within own partner only',
      canEdit: 'Own partner resources',
      canDelete: false,
      canLinkUser: 'Own partner resources',
      canSetRates: false,
      canViewRates: 'Own partner rates only',
      notes: 'Partner Admins manage their team within the partner'
    },
    partner_user: {
      role: 'Partner User',
      canView: 'Own resource only',
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canLinkUser: false,
      canSetRates: false,
      canViewRates: 'Own rate only',
      notes: 'Partner Users can only see their own record'
    }
  },
  
  faq: [
    {
      question: 'How do I link a resource to a user account?',
      answer: 'Open the resource details, click "Link User", search for an existing user by email, or invite a new user. Once linked, the person can log in and access the project with the permissions defined by their role.'
    },
    {
      question: 'What is the difference between a resource and a user?',
      answer: 'A resource is a project team member record with role and rate information. A user is a login account. Resources can exist without user accounts (for planning), and users can be linked to resources in multiple projects.'
    },
    {
      question: 'Can I see day rates for team members?',
      answer: 'Rate visibility depends on your role. PMs and Admins can see all rates. Contributors and Partner Users can only see their own rate. Customer PMs cannot see rates.'
    },
    {
      question: 'What happens if I remove a resource?',
      answer: 'The resource is removed from the project and loses access. Historical timesheets and expenses remain for audit. Resources with approved financial data cannot be deleted - consider deactivating instead.'
    },
    {
      question: 'How do partner resources work?',
      answer: 'Resources assigned to a partner are managed by that partner\'s Admin. They appear in partner-specific reports and their costs may be invoiced separately. Partner Admins can only see resources in their own partner organisation.'
    },
    {
      question: 'Can I have different rates for the same person?',
      answer: 'Yes, add multiple rates with different effective dates. The system automatically uses the rate that was active on each timesheet date. This is useful when rates change mid-project.'
    },
    {
      question: 'What are rate tiers?',
      answer: 'Rate tiers (Prime, Contractor, Mid, SME) categorise resources for benchmarking comparison. They align with industry rate cards and help validate that rates are competitive.'
    },
    {
      question: 'How do I invite someone to join the project?',
      answer: 'Create a resource record with their email, then click "Invite User". They\'ll receive an email to create their account. Once accepted, they\'re automatically linked and can access the project.'
    },
    {
      question: 'Can one person be on multiple projects?',
      answer: 'Yes, a user account can be linked to resources in multiple projects. Each project has its own resource record with potentially different roles and rates.'
    },
    {
      question: 'How is actual spend calculated from resources?',
      answer: 'When timesheets are approved, hours are multiplied by the resource\'s day rate (converted to hourly) to calculate actual spend. This rolls up to deliverables and milestones.'
    },
    {
      question: 'What does availability percentage mean?',
      answer: 'Availability indicates what percentage of their time the resource is allocated to this project. 100% means full-time. Use this for capacity planning and utilisation tracking.'
    },
    {
      question: 'Why can\'t I see some team members?',
      answer: 'Visibility depends on your role and partner assignment. Contributors see only themselves. Partner users see only their partner team. PMs and Admins see everyone in the project.'
    }
  ],
  
  related: ['team-members', 'timesheets', 'expenses', 'benchmarking', 'roles-permissions', 'billing']
};

export default resourcesGuide;
