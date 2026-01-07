// WBS Planning Feature Guide
// Complete how-to documentation for Work Breakdown Structure planning functionality

const wbsPlanningGuide = {
  id: 'wbs-planning',
  title: 'WBS Planning',
  category: 'planning',
  description: 'Create and manage your project Work Breakdown Structure (WBS) using an Excel-like grid interface. Define the project hierarchy from components down to individual tasks, set dates, effort, dependencies, and generate structures using AI assistance.',
  
  navigation: {
    path: '/plan',
    sidebar: 'Planning → WBS',
    quickAccess: 'Dashboard → Planning Overview widget',
    breadcrumb: 'Home > Planning > WBS'
  },
  
  howTo: {
    navigate: {
      title: 'Navigating the Planning Grid',
      steps: [
        'Navigate to the Planning page from the sidebar (Planning → WBS)',
        'The grid displays your work breakdown structure in a hierarchical tree',
        'Use the expand/collapse icons (+/-) to show or hide child items',
        'Click on any cell to select it for editing',
        'Use the toolbar at the top for bulk actions and view controls',
        'The summary bar at the bottom shows totals for the current view'
      ],
      tips: [
        'Double-click a cell to enter edit mode directly',
        'Use Tab to move to the next cell, Shift+Tab to move back',
        'Press Escape to cancel editing and revert changes',
        'The grid auto-saves changes as you make them',
        'Use column headers to sort the view'
      ],
      keyboardShortcuts: {
        'Tab': 'Move to next cell',
        'Shift + Tab': 'Move to previous cell',
        'Enter': 'Confirm edit and move down',
        'Escape': 'Cancel current edit',
        'Arrow Keys': 'Navigate between cells',
        'Ctrl + Z': 'Undo last change',
        'Ctrl + Y': 'Redo last change',
        'Delete': 'Clear cell content'
      }
    },
    addItems: {
      title: 'Adding Items to the WBS',
      steps: [
        'Select the row below which you want to add a new item',
        'Click the "Add Item" button in the toolbar, or right-click for context menu',
        'Choose the item type: Component, Milestone, Deliverable, or Task',
        'A new row is inserted with the selected type',
        'Enter the name in the Name column',
        'Fill in other required fields: dates, effort, etc.',
        'The item is saved automatically'
      ],
      tips: [
        'Items are automatically placed at the correct hierarchy level based on selection',
        'You can also use keyboard shortcut Ctrl+Enter to add a new item below',
        'Copy/paste rows from Excel using Ctrl+C and Ctrl+V',
        'Bulk add multiple items by pasting from a spreadsheet'
      ]
    },
    hierarchy: {
      title: 'Managing the WBS Hierarchy',
      steps: [
        'The WBS follows a strict hierarchy: Component → Milestone → Deliverable → Task',
        'To change an item\'s level, use the Indent (→) or Outdent (←) buttons',
        'Indent moves an item to be a child of the item above',
        'Outdent moves an item up one level in the hierarchy',
        'Drag and drop items to reorder within the same level',
        'Parent items automatically roll up dates and effort from children'
      ],
      hierarchy: [
        {
          level: 1,
          type: 'Component',
          description: 'Major project phases or work streams',
          examples: ['Discovery Phase', 'Development Phase', 'Testing Phase']
        },
        {
          level: 2,
          type: 'Milestone',
          description: 'Key deliverable points with budget allocation',
          examples: ['Requirements Complete', 'MVP Delivered', 'Go Live']
        },
        {
          level: 3,
          type: 'Deliverable',
          description: 'Specific work products to be delivered',
          examples: ['Requirements Document', 'Technical Design', 'Test Plan']
        },
        {
          level: 4,
          type: 'Task',
          description: 'Individual work items that can be tracked',
          examples: ['Write user stories', 'Review with stakeholders', 'Update diagrams']
        }
      ],
      tips: [
        'Components can only contain Milestones',
        'Milestones can only contain Deliverables',
        'Deliverables can only contain Tasks',
        'Tasks cannot have children - they are the lowest level',
        'Effort rolls up from tasks to deliverables to milestones to components'
      ]
    },
    aiGenerate: {
      title: 'Using AI to Generate WBS Structure',
      steps: [
        'Click the "AI Generate" button in the toolbar',
        'Enter a description of your project or the work to be done',
        'Optionally upload a document (SOW, requirements, proposal) for AI to analyse',
        'Review the AI-generated structure preview',
        'Adjust the structure if needed in the preview',
        'Click "Apply" to insert the generated structure into your plan',
        'Modify dates, effort, and assignments as needed'
      ],
      tips: [
        'Be specific in your description for better AI results',
        'Upload existing documents for more accurate structure generation',
        'AI generates a starting point - always review and refine',
        'You can regenerate with different parameters if not satisfied',
        'AI uses industry best practices for typical project types'
      ],
      aiCapabilities: [
        'Parse SOW documents to extract deliverables',
        'Suggest standard phases for project types',
        'Estimate effort based on similar projects',
        'Identify dependencies between deliverables',
        'Recommend milestone structure for billing'
      ]
    },
    import: {
      title: 'Importing Plan from Documents',
      steps: [
        'Click "Import" button in the toolbar',
        'Select the import source: Excel file, CSV, or Document',
        'For Excel/CSV: Map columns to WBS fields in the mapping dialog',
        'For Documents: AI will extract and structure the content',
        'Preview the imported structure before applying',
        'Click "Import" to add the items to your plan',
        'Review and adjust the imported structure'
      ],
      supportedFormats: [
        { format: 'Excel (.xlsx)', description: 'Import from Excel workbooks with column mapping' },
        { format: 'CSV (.csv)', description: 'Import from comma-separated files' },
        { format: 'Microsoft Project (.mpp)', description: 'Import project plans (structure only)' },
        { format: 'Word (.docx)', description: 'AI extracts structure from documents' },
        { format: 'PDF (.pdf)', description: 'AI extracts structure from PDF documents' }
      ],
      tips: [
        'Use the Excel template for best results - download from the Import dialog',
        'Ensure your Excel has headers matching the field names',
        'Hierarchy can be indicated by indentation or a level column',
        'Dates should be in DD/MM/YYYY format'
      ]
    },
    baseline: {
      title: 'Creating and Managing Baselines',
      steps: [
        'Complete your initial planning with all items, dates, and effort',
        'Click "Create Baseline" in the toolbar',
        'Enter a name for the baseline (e.g., "v1.0 Original Plan")',
        'Add optional notes describing the baseline',
        'Click "Save Baseline" to lock the current plan as baseline',
        'The baseline is now protected - changes will show as variances'
      ],
      baselineFeatures: [
        'Compare current plan against baseline at any time',
        'Variance columns show differences in dates and effort',
        'Baseline dates shown alongside current dates',
        'Track scope changes through variations',
        'Multiple baselines can be saved for version history'
      ],
      tips: [
        'Create a baseline before project execution begins',
        'Only Admins can create or modify baselines',
        'Use variations to document and approve changes to baseline',
        'Approved variations update the active baseline automatically',
        'You can view historical baselines but not edit them'
      ]
    },
    dependencies: {
      title: 'Managing Dependencies',
      steps: [
        'Click on the Dependencies column for an item',
        'Click "Add Dependency" or start typing to search',
        'Select the predecessor item from the dropdown',
        'Choose the dependency type: Finish-to-Start, Start-to-Start, etc.',
        'Set an optional lag time (days) if needed',
        'Click "Add" to save the dependency',
        'The grid will show a warning if dependencies create conflicts'
      ],
      dependencyTypes: [
        { type: 'FS', name: 'Finish-to-Start', description: 'Task B cannot start until Task A finishes' },
        { type: 'SS', name: 'Start-to-Start', description: 'Task B cannot start until Task A starts' },
        { type: 'FF', name: 'Finish-to-Finish', description: 'Task B cannot finish until Task A finishes' },
        { type: 'SF', name: 'Start-to-Finish', description: 'Task B cannot finish until Task A starts' }
      ],
      tips: [
        'Finish-to-Start (FS) is the most common dependency type',
        'Use lag time for buffers or waiting periods',
        'Circular dependencies are not allowed and will show an error',
        'Dependencies affect date calculations automatically'
      ]
    },
    view: {
      title: 'Viewing and Filtering the Plan',
      steps: [
        'Use the View dropdown to switch between views: Grid, Gantt, Timeline',
        'Use the Filter panel to show/hide items by type, status, or assignee',
        'Use column visibility settings to show/hide columns',
        'Click column headers to sort by that field',
        'Use the search box to find specific items by name',
        'Collapse/expand sections to focus on specific areas'
      ],
      views: [
        { name: 'Grid View', description: 'Spreadsheet-style editing with all columns' },
        { name: 'Gantt View', description: 'Timeline chart showing dates and dependencies' },
        { name: 'Timeline View', description: 'Simplified timeline for presentations' }
      ],
      tips: [
        'Grid view is best for bulk editing and data entry',
        'Gantt view is best for visualising timelines and dependencies',
        'Export to PDF from any view for stakeholder presentations',
        'Save custom views with your preferred filters and columns'
      ]
    }
  },
  
  fields: {
    name: {
      name: 'Name',
      label: 'Item Name',
      required: true,
      type: 'text',
      description: 'The name or title of the WBS item',
      validation: 'Required. Maximum 200 characters.',
      tips: 'Use clear, descriptive names. Follow naming conventions for consistency.'
    },
    item_type: {
      name: 'Type',
      label: 'Item Type',
      required: true,
      type: 'select',
      description: 'The type of WBS item determining its hierarchy level',
      values: ['Component', 'Milestone', 'Deliverable', 'Task'],
      validation: 'Must follow hierarchy rules - types can only contain specific child types',
      tips: 'Type determines what children can be added and how rollups work'
    },
    start_date: {
      name: 'Start Date',
      label: 'Start Date',
      required: true,
      type: 'date',
      description: 'When work on this item begins',
      validation: 'Must be within project date range. Cannot be after end date.',
      tips: 'Parent item dates are calculated from children automatically',
      format: 'DD/MM/YYYY'
    },
    end_date: {
      name: 'End Date',
      label: 'End Date',
      required: true,
      type: 'date',
      description: 'When work on this item completes',
      validation: 'Must be within project date range. Cannot be before start date.',
      tips: 'Parent item dates are calculated from children automatically',
      format: 'DD/MM/YYYY'
    },
    effort_days: {
      name: 'Effort',
      label: 'Effort (Days)',
      required: false,
      type: 'number',
      description: 'Estimated effort in person-days',
      validation: 'Must be positive. Parent items roll up from children.',
      tips: 'Enter effort at task level - it rolls up to parents automatically',
      min: 0,
      step: 0.5
    },
    status: {
      name: 'Status',
      label: 'Status',
      required: false,
      type: 'select',
      description: 'Current status of the item',
      values: ['Not Started', 'In Progress', 'Complete', 'On Hold', 'Cancelled'],
      tips: 'Status updates affect progress calculations and dashboard views'
    },
    owner: {
      name: 'Owner',
      label: 'Owner',
      required: false,
      type: 'select',
      description: 'Team member responsible for this item',
      validation: 'Must be a resource in the project',
      tips: 'Set owners at deliverable or task level for accountability'
    },
    dependencies: {
      name: 'Dependencies',
      label: 'Dependencies',
      required: false,
      type: 'multiselect',
      description: 'Items that must complete before this item can start',
      validation: 'Cannot create circular dependencies',
      tips: 'Click to manage predecessors. Dependencies affect scheduling.'
    },
    notes: {
      name: 'Notes',
      label: 'Notes',
      required: false,
      type: 'textarea',
      description: 'Additional information or context for this item',
      validation: 'Maximum 2000 characters',
      tips: 'Use notes for acceptance criteria, assumptions, or clarifications'
    },
    baseline_start: {
      name: 'Baseline Start',
      label: 'Baseline Start',
      required: false,
      type: 'readonly',
      description: 'Original planned start date from baseline',
      tips: 'Compare against current start date to see schedule variance'
    },
    baseline_end: {
      name: 'Baseline End',
      label: 'Baseline End',
      required: false,
      type: 'readonly',
      description: 'Original planned end date from baseline',
      tips: 'Compare against current end date to see schedule variance'
    },
    variance: {
      name: 'Variance',
      label: 'Variance (Days)',
      required: false,
      type: 'readonly',
      description: 'Difference between current and baseline end dates',
      tips: 'Positive = behind schedule, Negative = ahead of schedule'
    }
  },
  
  itemTypes: {
    component: {
      name: 'Component',
      level: 1,
      description: 'Major project phases or work streams. Components group related milestones.',
      canContain: ['Milestone'],
      examples: ['Discovery Phase', 'Development Phase', 'Testing Phase', 'Deployment'],
      rollups: 'Dates and effort roll up from child milestones'
    },
    milestone: {
      name: 'Milestone',
      level: 2,
      description: 'Key payment points with budget allocation. Milestones have certificates for sign-off.',
      canContain: ['Deliverable'],
      examples: ['Requirements Complete', 'Design Approved', 'UAT Complete', 'Go Live'],
      rollups: 'Dates and effort roll up from child deliverables',
      specialFeatures: ['Budget allocation', 'Certificate sign-off', 'Payment tracking']
    },
    deliverable: {
      name: 'Deliverable',
      level: 3,
      description: 'Specific work products to be delivered. Deliverables go through review workflow.',
      canContain: ['Task'],
      examples: ['Requirements Document', 'Technical Design', 'Test Plan', 'User Guide'],
      rollups: 'Dates and effort roll up from child tasks',
      specialFeatures: ['Review workflow', 'Document attachments', 'Status tracking']
    },
    task: {
      name: 'Task',
      level: 4,
      description: 'Individual work items that can be tracked. Tasks are the lowest level.',
      canContain: [],
      examples: ['Write user stories', 'Review document', 'Fix defect', 'Attend workshop'],
      rollups: 'None - tasks are leaf nodes',
      specialFeatures: ['Time tracking', 'Assignee tracking']
    }
  },
  
  keyboardShortcuts: {
    navigation: {
      'Arrow Up/Down': 'Move selection up or down',
      'Arrow Left/Right': 'Move selection left or right',
      'Tab': 'Move to next cell',
      'Shift + Tab': 'Move to previous cell',
      'Home': 'Go to first cell in row',
      'End': 'Go to last cell in row',
      'Ctrl + Home': 'Go to first cell in grid',
      'Ctrl + End': 'Go to last cell in grid',
      'Page Up/Down': 'Scroll up or down one page'
    },
    editing: {
      'Enter': 'Start editing cell / Confirm edit',
      'Escape': 'Cancel edit',
      'Delete': 'Clear cell content',
      'Backspace': 'Clear and start editing',
      'F2': 'Edit cell',
      'Ctrl + Z': 'Undo',
      'Ctrl + Y': 'Redo',
      'Ctrl + C': 'Copy selection',
      'Ctrl + V': 'Paste',
      'Ctrl + X': 'Cut selection'
    },
    actions: {
      'Ctrl + Enter': 'Add new row below',
      'Ctrl + Delete': 'Delete selected row',
      'Ctrl + →': 'Indent item',
      'Ctrl + ←': 'Outdent item',
      'Ctrl + +': 'Expand selected item',
      'Ctrl + -': 'Collapse selected item',
      'Ctrl + S': 'Save current changes',
      'Ctrl + F': 'Open search'
    }
  },
  
  permissions: {
    contributor: {
      role: 'Contributor',
      canView: 'Full plan visibility',
      canCreate: false,
      canEdit: 'Own assigned tasks only',
      canDelete: false,
      canBaseline: false,
      canImport: false,
      canAiGenerate: false,
      notes: 'Contributors can view the plan and update their assigned tasks'
    },
    supplier_pm: {
      role: 'Supplier PM',
      canView: 'Full plan visibility',
      canCreate: true,
      canEdit: 'All items',
      canDelete: true,
      canBaseline: false,
      canImport: true,
      canAiGenerate: true,
      notes: 'Supplier PMs manage the day-to-day plan but cannot create baselines'
    },
    customer_pm: {
      role: 'Customer PM',
      canView: 'Full plan visibility',
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canBaseline: false,
      canImport: false,
      canAiGenerate: false,
      notes: 'Customer PMs can view the plan but not modify it directly'
    },
    admin: {
      role: 'Admin',
      canView: 'Full plan visibility',
      canCreate: true,
      canEdit: 'All items',
      canDelete: true,
      canBaseline: true,
      canImport: true,
      canAiGenerate: true,
      notes: 'Admins have full access including baseline creation'
    },
    partner_admin: {
      role: 'Partner Admin',
      canView: 'Full plan visibility',
      canCreate: false,
      canEdit: 'Partner assigned items only',
      canDelete: false,
      canBaseline: false,
      canImport: false,
      canAiGenerate: false,
      notes: 'Partner Admins can view and update their assigned items'
    },
    partner_user: {
      role: 'Partner User',
      canView: 'Full plan visibility',
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canBaseline: false,
      canImport: false,
      canAiGenerate: false,
      notes: 'Partner Users can only view the plan'
    }
  },
  
  faq: [
    {
      question: 'How do I create a baseline?',
      answer: 'Only Admins can create baselines. Click "Create Baseline" in the toolbar, enter a name and notes, then save. The current plan becomes the baseline and any future changes will show as variances.'
    },
    {
      question: 'Can I undo changes to the plan?',
      answer: 'Yes, use Ctrl+Z to undo recent changes. The system keeps a history of changes for the current session. For changes made in previous sessions, you can view the audit log or restore from a baseline.'
    },
    {
      question: 'How does the AI generation work?',
      answer: 'The AI analyses your project description or uploaded documents to suggest a WBS structure. It uses patterns from similar projects to recommend phases, milestones, and deliverables. Always review and refine the AI suggestions.'
    },
    {
      question: 'Why can\'t I delete a milestone?',
      answer: 'Milestones with associated timesheets, expenses, or approved variations cannot be deleted. You need to reassign or remove the associated data first, or mark the milestone as cancelled instead.'
    },
    {
      question: 'How do effort rollups work?',
      answer: 'Effort entered at the task level automatically rolls up to the parent deliverable, then to the milestone, then to the component. Parent effort fields are calculated - you cannot edit them directly.'
    },
    {
      question: 'Can I import from Microsoft Project?',
      answer: 'Yes, you can import .mpp files. The structure, dates, and dependencies will be imported. Some MS Project-specific features may not translate directly - review after import.'
    },
    {
      question: 'How do I handle changes to the baseline plan?',
      answer: 'Use the Variations feature to formally document and approve changes. Approved variations can automatically update the baseline. This creates an audit trail of scope changes.'
    },
    {
      question: 'What happens if I create a circular dependency?',
      answer: 'The system will show an error and prevent saving. You\'ll need to review your dependencies and remove the circular reference. The error message will indicate which items are involved.'
    },
    {
      question: 'Can I bulk edit multiple items?',
      answer: 'Yes, select multiple rows using Ctrl+Click or Shift+Click, then use the bulk edit options in the toolbar to change status, owner, or dates for all selected items.'
    },
    {
      question: 'How do I copy items between projects?',
      answer: 'Export items from the source project to Excel, then import into the target project. You\'ll need to map the data and adjust dates for the new project timeline.'
    }
  ],
  
  related: ['estimator', 'benchmarking', 'milestones', 'deliverables', 'variations', 'resources']
};

export default wbsPlanningGuide;
