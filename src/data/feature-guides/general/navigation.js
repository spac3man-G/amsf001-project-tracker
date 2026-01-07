// Navigation Feature Guide
// Complete how-to documentation for application navigation

const navigationGuide = {
  id: 'navigation',
  title: 'Navigation',
  category: 'general',
  description: 'Learn how to navigate the application effectively. Understand the sidebar, header controls, project switching, search functionality, and keyboard shortcuts for efficient work.',
  
  navigation: {
    path: '/',
    sidebar: 'All sections',
    quickAccess: 'Available everywhere',
    breadcrumb: 'Home'
  },
  
  howTo: {
    sidebar: {
      title: 'Using the Sidebar Navigation',
      steps: [
        'The sidebar is on the left side of the screen',
        'It contains all main sections of the application',
        'Click a section heading to expand/collapse subsections',
        'Click a menu item to navigate to that page',
        'Current page is highlighted in the sidebar',
        'Collapse sidebar using the toggle button for more workspace'
      ],
      sections: [
        {
          section: 'Dashboard',
          description: 'Project overview and quick access widgets',
          subsections: ['Overview', 'My Tasks', 'Reports']
        },
        {
          section: 'Time & Expenses',
          description: 'Timesheet and expense management',
          subsections: ['Timesheets', 'Expenses']
        },
        {
          section: 'Delivery',
          description: 'Project work management',
          subsections: ['Milestones', 'Deliverables', 'Resources']
        },
        {
          section: 'Planning',
          description: 'WBS, estimation, and planning tools',
          subsections: ['WBS', 'Estimator', 'Benchmarking']
        },
        {
          section: 'Project Management',
          description: 'Variations, RAID, quality, KPIs',
          subsections: ['Variations', 'RAID Log', 'Quality Standards', 'KPIs']
        },
        {
          section: 'Finance',
          description: 'Billing and partner invoices',
          subsections: ['Billing', 'Partner Invoices']
        },
        {
          section: 'Evaluator',
          description: 'Software evaluation projects',
          subsections: ['Evaluations', 'Requirements', 'Vendors', 'Scoring', 'Reports']
        },
        {
          section: 'Admin',
          description: 'Project and organisation settings',
          subsections: ['Project Settings', 'Team Members', 'Audit Log']
        }
      ],
      tips: [
        'Collapsed sidebar shows icons only - hover for labels',
        'Most recently used items appear at the top',
        'Badge icons show items needing attention'
      ]
    },
    header: {
      title: 'Using the Header Controls',
      steps: [
        'The header bar is at the top of every page',
        'Left side: Logo, project selector, breadcrumbs',
        'Center: Global search bar',
        'Right side: Notifications, help, user menu'
      ],
      headerElements: [
        { element: 'Logo', description: 'Click to return to dashboard' },
        { element: 'Project Selector', description: 'Switch between projects' },
        { element: 'Breadcrumbs', description: 'Shows current location, click to navigate up' },
        { element: 'Search', description: 'Search across all project data' },
        { element: 'Notifications', description: 'View alerts and notifications' },
        { element: 'Help', description: 'Access help and documentation' },
        { element: 'User Menu', description: 'Profile, settings, logout' }
      ],
      tips: [
        'Breadcrumbs help you understand where you are',
        'Notification badge shows unread count',
        'Search is the fastest way to find specific items'
      ]
    },
    projectSwitcher: {
      title: 'Switching Between Projects',
      steps: [
        'Click the project name in the header (or dropdown arrow)',
        'A list of your projects appears',
        'Click a project to switch to it',
        'Recently accessed projects appear first',
        'Use search to find projects in long lists',
        'The page refreshes with the selected project\'s data'
      ],
      tips: [
        'Star frequently used projects for quick access',
        'Projects are grouped by organisation',
        'Your role may differ between projects'
      ]
    },
    search: {
      title: 'Using Global Search',
      steps: [
        'Click the search box in the header (or press /)',
        'Type your search terms',
        'Results appear grouped by type (Timesheets, Expenses, etc.)',
        'Click a result to navigate directly to it',
        'Use filters to narrow results by type',
        'Recent searches are saved for quick access'
      ],
      searchableContent: [
        { type: 'Timesheets', searchBy: 'Date, deliverable, notes' },
        { type: 'Expenses', searchBy: 'Description, category, amount' },
        { type: 'Milestones', searchBy: 'Name, description' },
        { type: 'Deliverables', searchBy: 'Name, description, status' },
        { type: 'Resources', searchBy: 'Name, email, role' },
        { type: 'RAID Items', searchBy: 'Title, description, type' },
        { type: 'Variations', searchBy: 'Title, description, status' },
        { type: 'Team Members', searchBy: 'Name, email' }
      ],
      tips: [
        'Use quotes for exact phrases: "project plan"',
        'Search by ID for specific items: TIM-001',
        'Press Escape to close search'
      ]
    },
    notifications: {
      title: 'Managing Notifications',
      steps: [
        'Click the bell icon in the header',
        'View recent notifications',
        'Unread notifications have a blue dot',
        'Click a notification to go to the related item',
        'Mark as read or dismiss notifications',
        'Click "See All" to view notification center'
      ],
      notificationTypes: [
        { type: 'Approvals', description: 'Items waiting for your approval' },
        { type: 'Status Changes', description: 'Updates to items you\'re involved with' },
        { type: 'Comments', description: 'Replies to your items or mentions' },
        { type: 'Deadlines', description: 'Upcoming or overdue items' },
        { type: 'Assignments', description: 'Work assigned to you' }
      ],
      tips: [
        'Configure notification preferences in Settings',
        'Critical notifications cannot be disabled',
        'Email notifications follow the same preferences'
      ]
    },
    dashboard: {
      title: 'Using the Dashboard',
      steps: [
        'Dashboard is your home page when entering a project',
        'Widgets show key information and quick actions',
        'Click widget titles to go to full pages',
        'Some widgets have action buttons',
        'Customize which widgets appear (if enabled)',
        'Refresh widgets individually or all at once'
      ],
      dashboardWidgets: [
        { widget: 'My Draft Timesheets', description: 'Timesheets ready to submit' },
        { widget: 'Pending Approvals', description: 'Items waiting for your action' },
        { widget: 'Budget Status', description: 'Financial summary' },
        { widget: 'Milestone Progress', description: 'Delivery status' },
        { widget: 'RAID Summary', description: 'Open risks and issues' },
        { widget: 'Recent Activity', description: 'Latest project activity' },
        { widget: 'My Tasks', description: 'Work assigned to you' }
      ],
      tips: [
        'Dashboard gives a quick project health check',
        'Widget badges show counts needing attention',
        'Click through to take action on items'
      ]
    },
    breadcrumbs: {
      title: 'Using Breadcrumbs',
      steps: [
        'Breadcrumbs appear below the header',
        'They show your current location in the app',
        'Format: Home > Section > Subsection > Item',
        'Click any level to navigate back to it',
        'Home returns you to the dashboard'
      ],
      tips: [
        'Breadcrumbs are faster than sidebar for going back',
        'Shows context of where you are',
        'Last item is the current page (not clickable)'
      ]
    },
    quickActions: {
      title: 'Using Quick Actions',
      steps: [
        'Quick actions are available via the "+" button',
        'Located in the header or floating action button',
        'Click to see available quick actions',
        'Common actions: New Timesheet, New Expense, etc.',
        'Keyboard shortcut: Press N for new'
      ],
      quickActions: [
        'New Timesheet Entry',
        'New Expense Claim',
        'New RAID Item',
        'New Variation',
        'Quick Search'
      ],
      tips: [
        'Quick actions adapt to your permissions',
        'Available from any page',
        'Fastest way to create new items'
      ]
    }
  },
  
  keyboardShortcuts: {
    title: 'Keyboard Shortcuts',
    description: 'Navigate faster with keyboard shortcuts.',
    shortcuts: {
      global: [
        { shortcut: '/', description: 'Open search' },
        { shortcut: 'N', description: 'New item (context sensitive)' },
        { shortcut: 'G then D', description: 'Go to Dashboard' },
        { shortcut: 'G then T', description: 'Go to Timesheets' },
        { shortcut: 'G then E', description: 'Go to Expenses' },
        { shortcut: 'G then M', description: 'Go to Milestones' },
        { shortcut: '?', description: 'Show keyboard shortcuts' },
        { shortcut: 'Escape', description: 'Close dialogs, cancel' }
      ],
      lists: [
        { shortcut: 'J / K', description: 'Move down / up in lists' },
        { shortcut: 'Enter', description: 'Open selected item' },
        { shortcut: 'X', description: 'Select/deselect item' },
        { shortcut: 'A', description: 'Select all visible' },
        { shortcut: 'F', description: 'Open filters' }
      ],
      forms: [
        { shortcut: 'Tab', description: 'Next field' },
        { shortcut: 'Shift + Tab', description: 'Previous field' },
        { shortcut: 'Ctrl + Enter', description: 'Save/submit form' },
        { shortcut: 'Escape', description: 'Cancel/close form' }
      ]
    },
    tips: [
      'Press ? anywhere to see shortcuts',
      'Not all shortcuts work on all pages',
      'Focus must be in the app (not in text fields)'
    ]
  },
  
  mobile: {
    title: 'Mobile Navigation',
    description: 'Using the app on mobile devices.',
    elements: [
      { element: 'Hamburger Menu', description: 'Tap to open sidebar navigation' },
      { element: 'Bottom Navigation', description: 'Quick access to main sections' },
      { element: 'Pull to Refresh', description: 'Pull down to refresh data' },
      { element: 'Swipe Actions', description: 'Swipe items for quick actions' }
    ],
    tips: [
      'Use landscape mode for grids and tables',
      'Bottom nav provides fastest access',
      'Some features are desktop-only'
    ]
  },
  
  accessibility: {
    title: 'Accessibility Features',
    features: [
      { feature: 'Keyboard Navigation', description: 'Full keyboard support for all actions' },
      { feature: 'Screen Reader', description: 'ARIA labels and landmarks' },
      { feature: 'Focus Indicators', description: 'Clear visual focus states' },
      { feature: 'Contrast', description: 'WCAG AA compliant color contrast' },
      { feature: 'Text Scaling', description: 'Supports browser zoom up to 200%' }
    ],
    tips: [
      'Tab through interactive elements',
      'Use Skip Link to bypass navigation',
      'High contrast mode available in Settings'
    ]
  },
  
  faq: [
    {
      question: 'How do I collapse the sidebar?',
      answer: 'Click the toggle button at the bottom of the sidebar (hamburger icon), or press [ on your keyboard. Collapsed sidebar shows icons only.'
    },
    {
      question: 'How do I switch projects?',
      answer: 'Click the project name in the header to open the project selector. Click the project you want to switch to. Recently used projects appear first.'
    },
    {
      question: 'How do I find a specific item?',
      answer: 'Use the global search (/ key or click search box). Type what you\'re looking for. Results are grouped by type. Click a result to go directly to it.'
    },
    {
      question: 'Can I customize the dashboard?',
      answer: 'If enabled for your project, click "Customize" on the dashboard to add, remove, or rearrange widgets. Some widgets are required and cannot be removed.'
    },
    {
      question: 'How do I get back to the previous page?',
      answer: 'Use your browser\'s back button, or click a parent level in the breadcrumbs. Breadcrumbs are often faster for navigating up.'
    },
    {
      question: 'Why can\'t I see certain menu items?',
      answer: 'Menu visibility depends on your role and permissions. You only see sections you have access to. Contact your Admin if you need additional access.'
    },
    {
      question: 'How do I clear my notification list?',
      answer: 'In the notifications panel, click "Mark All Read" to clear the unread indicator. Individual notifications can be dismissed with the X button.'
    },
    {
      question: 'Is there a mobile app?',
      answer: 'The web application is responsive and works on mobile browsers. Some features are optimized for desktop but core functionality works on mobile.'
    }
  ],
  
  related: ['roles-permissions', 'workflows', 'timesheets', 'expenses']
};

export default navigationGuide;
