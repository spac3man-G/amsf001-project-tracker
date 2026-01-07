// Workshops Feature Guide
// Complete how-to documentation for evaluation workshops

const workshopsGuide = {
  id: 'workshops',
  title: 'Evaluation Workshops',
  category: 'evaluator',
  description: 'Schedule and manage evaluation workshops including vendor demonstrations, scoring sessions, and consensus meetings. Coordinate attendees, record outcomes, and track action items.',
  
  navigation: {
    path: '/evaluator/:id/workshops',
    sidebar: 'Evaluator → [Evaluation] → Workshops',
    quickAccess: 'Evaluation Dashboard → Upcoming Workshops',
    breadcrumb: 'Home > Evaluator > [Evaluation Name] > Workshops'
  },
  
  howTo: {
    schedule: {
      title: 'Scheduling a Workshop',
      steps: [
        'Navigate to your evaluation\'s Workshops page',
        'Click "Schedule Workshop" button',
        'Select the workshop type',
        'Enter a descriptive title',
        'Select the date and time',
        'Set the duration',
        'Choose the location (room or video link)',
        'Add the agenda or topics to cover',
        'Select the vendor(s) involved (if applicable)',
        'Save the workshop'
      ],
      tips: [
        'Check attendee availability before scheduling',
        'Allow buffer time between back-to-back sessions',
        'Include video conferencing link for remote attendees',
        'Share agenda with attendees in advance'
      ]
    },
    invite: {
      title: 'Managing Workshop Attendees',
      steps: [
        'Open the workshop you want to manage',
        'Go to the Attendees section',
        'Click "Add Attendees"',
        'Select evaluation team members to invite',
        'For vendor workshops, vendor contacts are auto-added',
        'Set attendee roles: Required, Optional, Facilitator',
        'Send calendar invitations',
        'Track RSVP responses'
      ],
      attendeeRoles: [
        { role: 'Facilitator', description: 'Leads and coordinates the workshop' },
        { role: 'Required', description: 'Essential attendees whose input is needed' },
        { role: 'Optional', description: 'Can attend if available, not critical' },
        { role: 'Vendor', description: 'Vendor representatives (for demos)' }
      ],
      tips: [
        'Include key stakeholders for important workshops',
        'Limit attendee count for productive discussions',
        'Ensure facilitator is confirmed',
        'Send reminders before the workshop'
      ]
    },
    runDemo: {
      title: 'Running a Vendor Demo Workshop',
      steps: [
        'Prepare the demo agenda and scenarios',
        'Share agenda with vendor in advance',
        'Set up recording if permitted',
        'Welcome vendor and make introductions',
        'Cover standard demo script/scenarios',
        'Allow time for Q&A',
        'Thank vendor and confirm next steps',
        'Record observations and scores immediately after'
      ],
      demoAgenda: [
        { section: 'Introduction', duration: '5 min', description: 'Welcome, agenda review' },
        { section: 'Product Overview', duration: '15 min', description: 'High-level capabilities' },
        { section: 'Use Case Scenarios', duration: '45 min', description: 'Demonstrate specific scenarios' },
        { section: 'Q&A', duration: '20 min', description: 'Team questions' },
        { section: 'Next Steps', duration: '5 min', description: 'Timeline, follow-up items' }
      ],
      tips: [
        'Use same scenarios for all vendors',
        'Assign timekeeper to keep on track',
        'Capture questions for follow-up',
        'Record session if all parties consent'
      ]
    },
    runScoring: {
      title: 'Running a Scoring Workshop',
      steps: [
        'Ensure individual scoring is complete',
        'Prepare scoring summary showing variance',
        'Share screen showing score distribution',
        'Work through requirements with disagreement',
        'Facilitate discussion on differing perspectives',
        'Guide team to consensus scores',
        'Document rationale for consensus decisions',
        'Record agreed scores in the system'
      ],
      scoringWorkshopProcess: [
        { step: 1, action: 'Review scoring completion status' },
        { step: 2, action: 'Show score distribution per requirement' },
        { step: 3, action: 'Identify high-variance requirements' },
        { step: 4, action: 'Discuss and resolve differences' },
        { step: 5, action: 'Record consensus score and evidence' },
        { step: 6, action: 'Move to next requirement' }
      ],
      tips: [
        'Focus on requirements with score variance >1',
        'Time-box discussions to keep moving',
        'Document minority opinions if not reaching full consensus',
        'Take breaks during long sessions'
      ]
    },
    runConsensus: {
      title: 'Running a Consensus Workshop',
      steps: [
        'Review all scores and identify areas of disagreement',
        'Share analysis showing vendor rankings',
        'Discuss key differentiators between top vendors',
        'Review Must Have requirement compliance',
        'Discuss concerns and risks for each vendor',
        'Guide discussion toward shortlist or recommendation',
        'Document decision rationale',
        'Assign follow-up actions'
      ],
      tips: [
        'Prepare analysis materials in advance',
        'Focus on differentiators, not commonalities',
        'Consider non-scored factors (strategic fit, risk)',
        'Document dissenting opinions'
      ]
    },
    record: {
      title: 'Recording Workshop Outcomes',
      steps: [
        'Open the workshop from the Workshops page',
        'Go to the Outcomes tab',
        'Enter the meeting summary/notes',
        'Record key decisions made',
        'Add action items with owners and due dates',
        'Attach any documents (minutes, recordings)',
        'Mark the workshop as complete',
        'Outcomes are linked to the evaluation record'
      ],
      outcomeTypes: [
        { type: 'Summary', description: 'High-level meeting notes' },
        { type: 'Decisions', description: 'Specific decisions made' },
        { type: 'Action Items', description: 'Tasks with owners and dates' },
        { type: 'Scores', description: 'Consensus scores agreed' },
        { type: 'Documents', description: 'Minutes, recordings, attachments' }
      ],
      tips: [
        'Record outcomes immediately after workshop',
        'Be specific about decisions and next steps',
        'Assign clear owners for action items',
        'Share summary with attendees'
      ]
    },
    view: {
      title: 'Viewing Workshop Schedule',
      steps: [
        'Navigate to the Workshops page',
        'View workshops in calendar or list format',
        'Filter by: Type, Vendor, Date range, Status',
        'Click any workshop to see details',
        'Upcoming workshops show at the top',
        'Past workshops show outcomes and recordings'
      ],
      views: [
        { view: 'Calendar', description: 'Monthly/weekly calendar view' },
        { view: 'List', description: 'Chronological list of all workshops' },
        { view: 'By Vendor', description: 'Workshops grouped by vendor' },
        { view: 'By Type', description: 'Workshops grouped by type' }
      ],
      tips: [
        'Use calendar view to spot scheduling conflicts',
        'Filter by vendor to see all interactions',
        'Check completion status before evaluation close'
      ]
    }
  },
  
  workshopTypes: {
    title: 'Workshop Types',
    types: [
      {
        type: 'Vendor Demo',
        purpose: 'Vendor demonstrates their product to evaluation team',
        typicalDuration: '1-2 hours',
        attendees: 'Evaluation team + vendor representatives',
        preparation: 'Demo scenarios, evaluation criteria checklist',
        outcomes: 'Demo observations, follow-up questions'
      },
      {
        type: 'Technical Deep Dive',
        purpose: 'Detailed technical assessment with IT/technical team',
        typicalDuration: '2-3 hours',
        attendees: 'Technical evaluators + vendor technical team',
        preparation: 'Technical requirements list, architecture questions',
        outcomes: 'Technical assessment scores, integration concerns'
      },
      {
        type: 'Scoring Session',
        purpose: 'Team reviews and aligns on vendor scores',
        typicalDuration: '1-2 hours per vendor',
        attendees: 'All evaluators',
        preparation: 'Individual scores completed, variance analysis',
        outcomes: 'Consensus scores, documented rationale'
      },
      {
        type: 'Consensus Meeting',
        purpose: 'Final decision-making discussion',
        typicalDuration: '1-2 hours',
        attendees: 'Key stakeholders and decision makers',
        preparation: 'Scoring summary, vendor comparison, recommendation',
        outcomes: 'Shortlist or final selection decision'
      },
      {
        type: 'Reference Call',
        purpose: 'Speak with vendor reference customers',
        typicalDuration: '30-45 minutes',
        attendees: '2-3 evaluation team members',
        preparation: 'Reference questions list',
        outcomes: 'Reference feedback, risk insights'
      },
      {
        type: 'Proof of Concept',
        purpose: 'Hands-on testing with vendor solution',
        typicalDuration: 'Days to weeks',
        attendees: 'Technical team + key users',
        preparation: 'POC scope, success criteria, test scenarios',
        outcomes: 'POC results, real-world assessment'
      }
    ]
  },
  
  fields: {
    title: {
      name: 'Title',
      label: 'Workshop Title',
      required: true,
      type: 'text',
      description: 'Clear, descriptive title for the workshop',
      validation: 'Required. Maximum 200 characters.',
      tips: 'Include vendor name and type for easy reference'
    },
    workshop_type: {
      name: 'Type',
      label: 'Workshop Type',
      required: true,
      type: 'select',
      description: 'The type of workshop',
      values: ['Vendor Demo', 'Technical Deep Dive', 'Scoring Session', 'Consensus Meeting', 'Reference Call', 'Proof of Concept', 'Other'],
      tips: 'Type determines default settings and templates'
    },
    date_time: {
      name: 'Date/Time',
      label: 'Date and Time',
      required: true,
      type: 'datetime',
      description: 'When the workshop takes place',
      validation: 'Required. Must be a future date/time.',
      tips: 'Check attendee availability before confirming'
    },
    duration: {
      name: 'Duration',
      label: 'Duration',
      required: true,
      type: 'select',
      description: 'Expected length of the workshop',
      values: ['30 min', '45 min', '1 hour', '1.5 hours', '2 hours', '3 hours', 'Half day', 'Full day'],
      tips: 'Include buffer time for overruns'
    },
    location: {
      name: 'Location',
      label: 'Location',
      required: false,
      type: 'text',
      description: 'Physical location or video conference link',
      tips: 'Include room name/number or video meeting URL'
    },
    vendor_id: {
      name: 'Vendor',
      label: 'Vendor',
      required: false,
      type: 'select',
      description: 'Vendor this workshop relates to',
      validation: 'Required for vendor-related workshops.',
      tips: 'Select "All Vendors" for general workshops'
    },
    agenda: {
      name: 'Agenda',
      label: 'Agenda',
      required: false,
      type: 'textarea',
      description: 'Topics to be covered in the workshop',
      validation: 'Maximum 5000 characters.',
      tips: 'Share with attendees in advance'
    },
    status: {
      name: 'Status',
      label: 'Status',
      required: false,
      type: 'readonly',
      description: 'Current status of the workshop',
      values: ['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Postponed'],
      tips: 'Status updates based on date and completion'
    },
    outcomes: {
      name: 'Outcomes',
      label: 'Outcomes',
      required: false,
      type: 'textarea',
      description: 'Summary of workshop outcomes and decisions',
      validation: 'Maximum 10000 characters.',
      tips: 'Record immediately after workshop'
    },
    action_items: {
      name: 'Action Items',
      label: 'Actions',
      required: false,
      type: 'list',
      description: 'Tasks arising from the workshop',
      tips: 'Include owner and due date for each action'
    },
    attachments: {
      name: 'Attachments',
      label: 'Attachments',
      required: false,
      type: 'file',
      description: 'Meeting materials, recordings, minutes',
      tips: 'Attach agenda, slides, recordings'
    }
  },
  
  permissions: {
    evaluation_admin: {
      role: 'Evaluation Admin',
      canSchedule: true,
      canEdit: true,
      canCancel: true,
      canInvite: true,
      canRecordOutcomes: true,
      notes: 'Full control over workshop management'
    },
    evaluator: {
      role: 'Evaluator',
      canSchedule: false,
      canEdit: false,
      canCancel: false,
      canInvite: false,
      canRecordOutcomes: 'Own attendance notes',
      notes: 'Can view and attend scheduled workshops'
    },
    reviewer: {
      role: 'Reviewer',
      canSchedule: false,
      canEdit: false,
      canCancel: false,
      canInvite: false,
      canRecordOutcomes: false,
      notes: 'Can view workshop schedules and outcomes'
    },
    observer: {
      role: 'Observer',
      canSchedule: false,
      canEdit: false,
      canCancel: false,
      canInvite: false,
      canRecordOutcomes: false,
      notes: 'Limited view of workshop schedule'
    }
  },
  
  faq: [
    {
      question: 'How far in advance should I schedule vendor demos?',
      answer: 'Schedule demos 2-3 weeks in advance to allow vendors time to prepare and to coordinate attendee calendars. Send the agenda and scenarios at least 1 week before.'
    },
    {
      question: 'Can I record vendor demos?',
      answer: 'Yes, with vendor permission. Ask for consent at the start of the session. Recordings are valuable for team members who can\'t attend and for reference during scoring.'
    },
    {
      question: 'How many people should attend a vendor demo?',
      answer: 'Typically 5-10 people is optimal. Too few may miss perspectives; too many can be overwhelming for vendors and hard to manage. Include representatives from each stakeholder area.'
    },
    {
      question: 'What if attendees can\'t make a scheduled workshop?',
      answer: 'Send calendar invites early and track RSVPs. Consider rescheduling if key attendees can\'t make it. For demos, ensure at least one representative from each stakeholder area can attend.'
    },
    {
      question: 'How do I run an effective scoring session?',
      answer: 'Complete individual scoring first. Focus on requirements with high variance. Use a facilitator to guide discussion. Time-box debates. Document consensus decisions and rationale.'
    },
    {
      question: 'Should all vendors get the same demo scenarios?',
      answer: 'Yes, for fair comparison. Create a standard demo script with the same scenarios and questions for all vendors. This enables meaningful comparison of capabilities.'
    },
    {
      question: 'How do I document workshop outcomes?',
      answer: 'Record key decisions, action items, and observations immediately after the workshop. Use the Outcomes section to document. Assign owners and due dates to actions.'
    },
    {
      question: 'Can vendors see the workshop schedule?',
      answer: 'Vendors only see workshops they\'re invited to. They receive calendar invitations with date, time, and agenda. They cannot see other vendors\' workshops or internal team sessions.'
    },
    {
      question: 'What happens if we need to cancel a workshop?',
      answer: 'Change the status to Cancelled and optionally add notes explaining why. Attendees receive cancellation notification. You can reschedule by creating a new workshop.'
    },
    {
      question: 'How do I handle remote attendees?',
      answer: 'Include video conference link in the location field. Test the connection before vendor sessions. Consider hybrid setups for best experience. Record for those who can\'t attend live.'
    }
  ],
  
  related: ['evaluation-setup', 'vendors', 'scoring', 'evaluator-reports']
};

export default workshopsGuide;
