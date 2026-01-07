// Deliverable Feature Guide
// Complete how-to documentation for deliverable functionality

const deliverablesGuide = {
  id: 'deliverables',
  title: 'Deliverables',
  category: 'core',
  description: 'Deliverables are the work products that must be completed within each milestone. They represent tangible outputs like documents, software, or other artefacts that are submitted for customer review. Deliverables can contain tasks for more granular tracking.',
  
  navigation: {
    path: '/deliverables',
    sidebar: 'Project → Deliverables',
    quickAccess: 'Dashboard → My Deliverables widget, or from Milestone details',
    breadcrumb: 'Home > Project > Deliverables'
  },
  
  howTo: {
    create: {
      title: 'Creating a Deliverable',
      steps: [
        'Navigate to the Deliverables page from the sidebar (Project → Deliverables)',
        'Click the "New Deliverable" button in the top right corner',
        'Enter a descriptive name for the deliverable',
        'Select the parent milestone this deliverable belongs to',
        'Set the planned start and end dates (must be within milestone dates)',
        'Add a description of what this deliverable includes',
        'Optionally assign a primary owner',
        'Click "Save" to create the deliverable'
      ],
      tips: [
        'Names should describe the output (e.g., "Requirements Document" not "D1")',
        'Link to the appropriate milestone for budget tracking',
        'Dates must fall within the parent milestone date range',
        'You can add tasks to the deliverable after creation',
        'Assign an owner for accountability'
      ],
      videoUrl: null
    },
    edit: {
      title: 'Editing a Deliverable',
      steps: [
        'Navigate to the Deliverables page or find in milestone details',
        'Click the edit icon (pencil) or click the row to open details',
        'Modify the name, dates, description, or owner',
        'Click "Save" to apply changes'
      ],
      tips: [
        'Completed deliverables can still be edited by PMs',
        'Date changes must stay within milestone boundaries',
        'Status changes have their own workflow'
      ]
    },
    updateStatus: {
      title: 'Updating Deliverable Status',
      steps: [
        'Open the deliverable details page',
        'Find the Status field',
        'Click to change the status',
        'Select the appropriate status based on progress',
        'Confirm the change'
      ],
      tips: [
        'Status should reflect actual progress',
        'Moving to "Awaiting Review" notifies reviewers',
        'Only move to "Delivered" when customer has accepted',
        'Status history is tracked for audit'
      ]
    },
    submitForReview: {
      title: 'Submitting a Deliverable for Review',
      steps: [
        'Ensure all tasks within the deliverable are complete',
        'Open the deliverable details page',
        'Click "Submit for Review" button',
        'Add any notes for the reviewer (optional)',
        'Confirm the submission',
        'Status will change to "Awaiting Review"',
        'Reviewers will be notified'
      ],
      tips: [
        'Complete all tasks before submitting',
        'Attach any supporting documents or links',
        'Notes help reviewers understand what to focus on',
        'You cannot edit the deliverable while under review'
      ]
    },
    completeReview: {
      title: 'Completing a Deliverable Review (PM/Admin)',
      steps: [
        'Navigate to the deliverable in "Awaiting Review" status',
        'Review the deliverable content and any attached artefacts',
        'Check that all acceptance criteria are met',
        'Click "Approve" to pass the review, or "Request Changes" to reject',
        'If approving, status moves to "Review Complete"',
        'If requesting changes, add notes explaining what needs fixing'
      ],
      tips: [
        'Review against the original requirements',
        'Check all tasks are genuinely complete',
        'Be specific in change request notes',
        'Multiple review cycles are normal'
      ]
    },
    markDelivered: {
      title: 'Marking a Deliverable as Delivered',
      steps: [
        'Ensure the deliverable has passed review ("Review Complete" status)',
        'Open the deliverable details page',
        'Click "Mark as Delivered" button',
        'Confirm the delivery',
        'Status will change to "Delivered"'
      ],
      tips: [
        'Only mark as delivered after customer acceptance',
        'Delivered status contributes to milestone progress',
        'This is the final status in the workflow'
      ]
    },
    manageTasks: {
      title: 'Managing Tasks within a Deliverable',
      steps: [
        'Open the deliverable details page',
        'Click the "Tasks" tab',
        'Click "Add Task" to create a new task',
        'Enter the task name and description',
        'Set planned dates, estimated effort, and assignee',
        'Click "Save" to add the task',
        'Mark tasks as complete using the checkbox as work progresses'
      ],
      tips: [
        'Tasks break down deliverables into smaller work items',
        'Task completion drives deliverable progress percentage',
        'Assign tasks to specific team members for accountability',
        'Effort estimates help with resource planning',
        'Tasks are optional but recommended for complex deliverables'
      ]
    },
    view: {
      title: 'Viewing Deliverables',
      steps: [
        'Navigate to the Deliverables page from the sidebar',
        'View the list showing name, milestone, status, dates, and progress',
        'Use filters to show specific statuses, milestones, or owners',
        'Use the date range filter to narrow down the view',
        'Click on any deliverable to see full details',
        'View tasks, timeline, and history in the detail view'
      ],
      tips: [
        'Filter by milestone to see deliverables for a specific phase',
        'Progress bar shows task completion percentage',
        'Status colours indicate workflow stage',
        'Export to CSV for reporting'
      ]
    }
  },
  
  fields: {
    name: {
      name: 'Name',
      label: 'Deliverable Name',
      required: true,
      type: 'text',
      description: 'A descriptive name for the deliverable',
      validation: 'Required. Maximum 200 characters.',
      tips: 'Use descriptive names like "Technical Design Document" not "D1".'
    },
    description: {
      name: 'Description',
      label: 'Description',
      required: false,
      type: 'textarea',
      description: 'Detailed description of what this deliverable includes',
      validation: 'Maximum 2000 characters',
      tips: 'Describe the scope, format, and acceptance criteria.'
    },
    milestone_id: {
      name: 'Milestone',
      label: 'Parent Milestone',
      required: true,
      type: 'select',
      description: 'The milestone this deliverable belongs to',
      tips: 'Deliverables must be linked to a milestone for tracking and billing.'
    },
    start_date: {
      name: 'Start Date',
      label: 'Planned Start Date',
      required: true,
      type: 'date',
      description: 'When work on this deliverable is planned to begin',
      validation: 'Must be within milestone date range.',
      tips: 'Plan start date based on dependencies and resource availability.',
      format: 'DD/MM/YYYY'
    },
    end_date: {
      name: 'End Date',
      label: 'Planned End Date',
      required: true,
      type: 'date',
      description: 'When this deliverable is planned to be complete',
      validation: 'Must be within milestone date range and after start date.',
      tips: 'Include time for review cycles.',
      format: 'DD/MM/YYYY'
    },
    owner_id: {
      name: 'Owner',
      label: 'Deliverable Owner',
      required: false,
      type: 'select',
      description: 'The team member responsible for this deliverable',
      tips: 'Assign an owner for clear accountability. Owners receive notifications about their deliverables.'
    },
    status: {
      name: 'Status',
      label: 'Status',
      required: true,
      type: 'select',
      description: 'Current workflow status of the deliverable',
      values: ['Not Started', 'In Progress', 'Awaiting Review', 'Review Complete', 'Delivered'],
      tips: 'Status progresses through the review workflow. See workflow section for details.'
    },
    progress: {
      name: 'Progress',
      label: 'Progress',
      required: false,
      type: 'percentage',
      description: 'Percentage of tasks completed',
      tips: 'Automatically calculated from task completion. Shows 0% if no tasks defined.'
    }
  },
  
  workflow: {
    title: 'Deliverable Review Workflow',
    description: 'Deliverables progress through stages from creation to final delivery, including a formal review process.',
    diagram: `
    ┌─────────────┐   Start    ┌─────────────┐   Submit    ┌─────────────────┐
    │ Not Started │ ─────────> │ In Progress │ ──────────> │ Awaiting Review │
    └─────────────┘            └─────────────┘             └─────────────────┘
                                                                   │
                                     ┌─────────────────────────────┴──────────────────┐
                                     │                                                │
                                     ▼ Approve                       Request Changes ▼
                              ┌─────────────────┐                    ┌─────────────┐
                              │ Review Complete │                    │ In Progress │
                              └─────────────────┘                    └─────────────┘
                                     │
                                     │ Deliver
                                     ▼
                              ┌───────────┐
                              │ Delivered │
                              └───────────┘
    `,
    statuses: [
      { 
        name: 'Not Started', 
        description: 'Deliverable created but work has not begun',
        colour: 'grey'
      },
      { 
        name: 'In Progress', 
        description: 'Work is actively being performed',
        colour: 'blue'
      },
      { 
        name: 'Awaiting Review', 
        description: 'Work submitted and waiting for review',
        colour: 'amber'
      },
      { 
        name: 'Review Complete', 
        description: 'Review passed, ready to mark as delivered',
        colour: 'teal'
      },
      { 
        name: 'Delivered', 
        description: 'Deliverable accepted and complete',
        colour: 'green'
      }
    ],
    transitions: [
      { 
        from: 'Not Started', 
        to: 'In Progress', 
        action: 'Start Work', 
        actor: 'Any team member',
        description: 'Begin work on the deliverable'
      },
      { 
        from: 'In Progress', 
        to: 'Awaiting Review', 
        action: 'Submit for Review', 
        actor: 'Contributor, PM, or Admin',
        description: 'Submit completed work for review'
      },
      { 
        from: 'Awaiting Review', 
        to: 'Review Complete', 
        action: 'Approve', 
        actor: 'PM or Admin',
        description: 'Review passed successfully'
      },
      { 
        from: 'Awaiting Review', 
        to: 'In Progress', 
        action: 'Request Changes', 
        actor: 'PM or Admin',
        description: 'Return for rework with feedback'
      },
      { 
        from: 'Review Complete', 
        to: 'Delivered', 
        action: 'Mark Delivered', 
        actor: 'PM or Admin',
        description: 'Final delivery confirmation'
      }
    ]
  },
  
  permissions: {
    contributor: {
      role: 'Contributor',
      canView: 'All deliverables in project',
      canCreate: false,
      canEdit: 'Assigned deliverables only',
      canDelete: false,
      canUpdateStatus: 'Own deliverables (limited)',
      canSubmitForReview: true,
      canReview: false,
      notes: 'Contributors work on assigned deliverables and submit for review'
    },
    supplier_pm: {
      role: 'Supplier PM',
      canView: 'All deliverables in project',
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canUpdateStatus: true,
      canSubmitForReview: true,
      canReview: true,
      notes: 'Supplier PMs manage deliverables and conduct reviews'
    },
    customer_pm: {
      role: 'Customer PM',
      canView: 'All deliverables in project',
      canCreate: false,
      canEdit: false,
      canDelete: false,
      canUpdateStatus: false,
      canSubmitForReview: false,
      canReview: true,
      notes: 'Customer PMs can review deliverables and request changes'
    },
    admin: {
      role: 'Admin',
      canView: 'All deliverables in project',
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canUpdateStatus: true,
      canSubmitForReview: true,
      canReview: true,
      notes: 'Admins have full access to all deliverable operations'
    },
    partner_admin: {
      role: 'Partner Admin',
      canView: 'All deliverables in project',
      canCreate: false,
      canEdit: 'Partner team deliverables',
      canDelete: false,
      canUpdateStatus: 'Partner team deliverables',
      canSubmitForReview: true,
      canReview: false,
      notes: 'Partner Admins manage deliverables for their team'
    },
    partner_user: {
      role: 'Partner User',
      canView: 'All deliverables in project',
      canCreate: false,
      canEdit: 'Assigned deliverables only',
      canDelete: false,
      canUpdateStatus: 'Assigned deliverables (limited)',
      canSubmitForReview: true,
      canReview: false,
      notes: 'Partner Users work on assigned deliverables'
    }
  },
  
  faq: [
    {
      question: 'What is the difference between a deliverable and a task?',
      answer: 'A deliverable is a significant work product that gets reviewed and delivered to the customer (e.g., a document or module). Tasks are smaller work items within a deliverable that help track progress. Deliverables are linked to milestones for billing; tasks are internal tracking.'
    },
    {
      question: 'How do I submit a deliverable for review?',
      answer: 'Open the deliverable details, ensure all tasks are complete, then click "Submit for Review". Add any notes for reviewers. The status will change to "Awaiting Review" and reviewers will be notified.'
    },
    {
      question: 'What happens if my deliverable is rejected in review?',
      answer: 'The status returns to "In Progress" with feedback notes from the reviewer. Address the feedback, complete any required changes, then submit for review again. Multiple review cycles are normal.'
    },
    {
      question: 'Can I add tasks to a deliverable?',
      answer: 'Yes, open the deliverable details and click the "Tasks" tab, then "Add Task". Tasks help break down work and track progress. Task completion automatically updates the deliverable progress percentage.'
    },
    {
      question: 'How does deliverable progress affect milestone progress?',
      answer: 'Milestone progress is calculated from the status of its deliverables. When deliverables move to "Delivered" status, they count towards milestone completion. The milestone progress bar reflects this.'
    },
    {
      question: 'Can I move a deliverable to a different milestone?',
      answer: 'Yes, edit the deliverable and change the parent milestone. Note that dates must still fall within the new milestone\'s date range. Timesheets logged against the deliverable will update automatically.'
    },
    {
      question: 'Who can review deliverables?',
      answer: 'Supplier PMs, Customer PMs, and Admins can review deliverables. Contributors can submit for review but cannot approve their own work.'
    },
    {
      question: 'How do I track time against a deliverable?',
      answer: 'When creating timesheet entries, select the deliverable from the dropdown. The hours will be tracked against that deliverable and rolled up to the milestone for billing calculations.'
    },
    {
      question: 'What does "Awaiting Review" status mean?',
      answer: 'The deliverable has been submitted and is waiting for a PM to review it. The assigned reviewers have been notified. No changes can be made while in this status.'
    },
    {
      question: 'Can I delete a deliverable?',
      answer: 'PMs and Admins can delete deliverables that have no approved timesheets against them. If time has been logged and approved, the deliverable cannot be deleted - consider marking it as cancelled instead.'
    }
  ],
  
  related: ['milestones', 'timesheets', 'resources', 'workflows', 'wbs-planning']
};

export default deliverablesGuide;
