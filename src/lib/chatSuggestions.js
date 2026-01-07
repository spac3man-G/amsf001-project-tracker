/**
 * Chat Suggested Questions Configuration
 * 
 * Contextual question suggestions based on current page and user role.
 * 
 * @version 1.0
 * @created 6 December 2025
 */

/**
 * Get suggested questions based on current page and user context
 * @param {string} pathname - Current route pathname
 * @param {string} role - User's role
 * @param {Object} context - Additional context (e.g., pending actions count)
 * @returns {Array<{text: string, category: string}>}
 */
export function getSuggestedQuestions(pathname, role, context = {}) {
  const questions = [];
  
  // Universal questions (always relevant)
  const universalQuestions = [
    { text: "What do I need to do?", category: "actions" },
    { text: "What's the project status?", category: "overview" }
  ];
  
  // Page-specific questions
  const pageQuestions = getPageSpecificQuestions(pathname, role);
  
  // Role-specific questions
  const roleQuestions = getRoleSpecificQuestions(role, context);
  
  // Combine and deduplicate
  const allQuestions = [...pageQuestions, ...roleQuestions, ...universalQuestions];
  
  // Return unique questions (max 5)
  const seen = new Set();
  return allQuestions
    .filter(q => {
      const key = q.text.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 5);
}

/**
 * Get questions specific to the current page
 */
function getPageSpecificQuestions(pathname, role) {
  // Normalize pathname
  const path = pathname.toLowerCase().replace(/\/+$/, '');
  
  // Dashboard
  if (path === '/dashboard' || path === '') {
    return [
      { text: "What milestones are at risk?", category: "milestones" },
      { text: "Show budget status", category: "budget" },
      { text: "What's overdue?", category: "overview" }
    ];
  }
  
  // Milestones
  if (path === '/milestones' || path.startsWith('/milestones/')) {
    return [
      { text: "Which milestones are at risk?", category: "milestones" },
      { text: "What milestones are due this month?", category: "milestones" },
      { text: "Show milestone progress summary", category: "milestones" },
      { text: "List overdue milestones", category: "milestones" }
    ];
  }
  
  // Deliverables
  if (path === '/deliverables') {
    return [
      { text: "What deliverables are awaiting review?", category: "deliverables" },
      { text: "Show overdue deliverables", category: "deliverables" },
      { text: "List deliverables by milestone", category: "deliverables" },
      { text: "What's the deliverable completion rate?", category: "deliverables" }
    ];
  }
  
  // Timesheets
  if (path === '/timesheets') {
    const questions = [
      { text: "Show my timesheets this month", category: "timesheets" },
      { text: "How many hours have I logged?", category: "timesheets" },
      { text: "Show timesheets pending validation", category: "timesheets" }
    ];
    
    if (['admin', 'supplier_pm', 'customer_pm'].includes(role)) {
      questions.push({ text: "Show all submitted timesheets", category: "timesheets" });
      questions.push({ text: "Hours by resource this month", category: "timesheets" });
    }
    
    return questions;
  }
  
  // Expenses
  if (path === '/expenses') {
    const questions = [
      { text: "Show my expenses this month", category: "expenses" },
      { text: "What expenses are pending validation?", category: "expenses" }
    ];
    
    if (['admin', 'supplier_pm'].includes(role)) {
      questions.push({ text: "Show all submitted expenses", category: "expenses" });
      questions.push({ text: "Expenses by category", category: "expenses" });
      questions.push({ text: "Total chargeable expenses", category: "expenses" });
    }
    
    return questions;
  }
  
  // Resources (enhanced in Segment 8)
  if (path === '/resources' || path.startsWith('/resources/')) {
    return [
      { text: "Show resource utilization", category: "resources" },
      { text: "Who has availability this week?", category: "resources" },
      { text: "List resources by partner", category: "resources" },
      { text: "Show resource capacity", category: "resources" },
      { text: "Who's working on what?", category: "resources" }
    ];
  }
  
  // Partners (enhanced in Segment 7)
  if (path === '/partners' || path.startsWith('/partners/')) {
    return [
      { text: "Show all partners", category: "partners" },
      { text: "Partner spend breakdown", category: "partners" },
      { text: "List active partners", category: "partners" },
      { text: "Partner hours this month", category: "partners" },
      { text: "Show partner invoices", category: "invoices" }
    ];
  }
  
  // Finance Hub (Segment 7)
  if (path === '/finance' || path.startsWith('/finance/')) {
    return [
      { text: "Show outstanding invoices", category: "invoices" },
      { text: "Total invoiced this month", category: "invoices" },
      { text: "Invoice status summary", category: "invoices" },
      { text: "Budget vs actual spend", category: "budget" }
    ];
  }
  
  // KPIs
  if (path === '/kpis' || path.startsWith('/kpis/')) {
    return [
      { text: "Which KPIs are at risk?", category: "kpis" },
      { text: "Show KPI trends", category: "kpis" },
      { text: "KPI summary by status", category: "kpis" }
    ];
  }
  
  // RAID Log
  if (path === '/raid') {
    return [
      { text: "Show open risks", category: "raid" },
      { text: "What issues need attention?", category: "raid" },
      { text: "List high-priority risks", category: "raid" },
      { text: "Show assumptions that need validation", category: "raid" }
    ];
  }
  
  // Quality Standards
  if (path === '/quality-standards' || path.startsWith('/quality-standards/')) {
    return [
      { text: "Which quality standards need attention?", category: "quality" },
      { text: "Show quality compliance summary", category: "quality" }
    ];
  }
  
  // Gantt
  if (path === '/gantt') {
    return [
      { text: "Show critical path", category: "timeline" },
      { text: "What's the project timeline?", category: "timeline" },
      { text: "List upcoming milestones", category: "milestones" }
    ];
  }
  
  // Planning (WBS)
  if (path === '/planning' || path.startsWith('/planning/')) {
    return [
      { text: "Show plan summary", category: "planning" },
      { text: "What tasks are overdue?", category: "planning" },
      { text: "Show items by status", category: "planning" },
      { text: "What's assigned to me?", category: "planning" },
      { text: "Show milestone progress", category: "planning" }
    ];
  }
  
  // Estimator
  if (path === '/estimator' || path.startsWith('/estimator/')) {
    return [
      { text: "Show all estimates", category: "estimates" },
      { text: "What's the total estimated cost?", category: "estimates" },
      { text: "Show approved estimates", category: "estimates" },
      { text: "List estimate components", category: "estimates" }
    ];
  }
  
  // Benchmarking
  if (path === '/benchmarking') {
    return [
      { text: "Show SFIA 8 rates", category: "rates" },
      { text: "What's the rate for a Level 5 Architect?", category: "rates" },
      { text: "Compare contractor vs Big 4 rates", category: "rates" },
      { text: "Show rates by category", category: "rates" }
    ];
  }
  
  // Variations
  if (path === '/variations' || path.startsWith('/variations/')) {
    return [
      { text: "Show pending variations", category: "variations" },
      { text: "What's the total cost impact?", category: "variations" },
      { text: "List approved variations", category: "variations" },
      { text: "Show variations by type", category: "variations" },
      { text: "Variations summary", category: "variations" }
    ];
  }
  
  // Workflow Summary
  if (path === '/workflow-summary') {
    return [
      { text: "What needs my approval?", category: "workflow" },
      { text: "Show pending submissions", category: "workflow" },
      { text: "List items awaiting validation", category: "workflow" }
    ];
  }
  
  // ============================================
  // SEGMENT 9-10: Evaluator Page Suggestions
  // ============================================
  
  // Evaluator Dashboard
  if (path === '/evaluator' || path === '/evaluator/dashboard') {
    return [
      { text: "Show evaluation status", category: "evaluator" },
      { text: "How many requirements are approved?", category: "evaluator" },
      { text: "Which vendors are shortlisted?", category: "evaluator" },
      { text: "Show scoring progress", category: "evaluator" }
    ];
  }
  
  // Requirements Hub
  if (path === '/evaluator/requirements' || path.startsWith('/evaluator/requirements/')) {
    return [
      { text: "Show all requirements", category: "evaluator" },
      { text: "List Must Have requirements", category: "evaluator" },
      { text: "Requirements pending approval", category: "evaluator" },
      { text: "Show AI-generated requirements", category: "evaluator" }
    ];
  }
  
  // Vendors Hub
  if (path === '/evaluator/vendors' || path.startsWith('/evaluator/vendors/')) {
    return [
      { text: "Show all vendors", category: "evaluator" },
      { text: "Which vendors have submitted?", category: "evaluator" },
      { text: "Vendor response status", category: "evaluator" },
      { text: "Show shortlisted vendors", category: "evaluator" }
    ];
  }
  
  // Workshops Hub
  if (path === '/evaluator/workshops') {
    return [
      { text: "Show upcoming workshops", category: "evaluator" },
      { text: "Workshop schedule", category: "evaluator" },
      { text: "Completed workshops", category: "evaluator" }
    ];
  }
  
  // Evaluator Reports Hub
  if (path === '/evaluator/reports') {
    return [
      { text: "Scoring summary by vendor", category: "evaluator" },
      { text: "Requirements coverage", category: "evaluator" },
      { text: "Vendor comparison", category: "evaluator" }
    ];
  }
  
  // Evaluator Scoring
  if (path === '/evaluator/scoring' || path.startsWith('/evaluator/scoring/')) {
    return [
      { text: "Show consensus scores", category: "evaluator" },
      { text: "Scoring progress", category: "evaluator" },
      { text: "My pending scores", category: "evaluator" }
    ];
  }
  
  // ============================================
  // SEGMENT 12: Remaining Page Suggestions
  // ============================================
  
  // Calendar
  if (path === '/calendar') {
    return [
      { text: "What's happening this week?", category: "calendar" },
      { text: "Upcoming milestone dates", category: "milestones" },
      { text: "Show deadlines this month", category: "calendar" }
    ];
  }
  
  // Reports
  if (path === '/reports') {
    return [
      { text: "Generate project status report", category: "reports" },
      { text: "Budget vs actual summary", category: "budget" },
      { text: "Resource utilisation report", category: "resources" }
    ];
  }
  
  // Team Members
  if (path === '/team-members') {
    return [
      { text: "Show team members", category: "resources" },
      { text: "Who has which role?", category: "resources" },
      { text: "Team capacity overview", category: "resources" }
    ];
  }
  
  // Settings / Project Settings
  if (path === '/settings' || path === '/project-settings') {
    return [
      { text: "What are my permissions?", category: "overview" },
      { text: "Explain my role", category: "overview" }
    ];
  }
  
  // Admin pages
  if (path.startsWith('/admin')) {
    return [
      { text: "Show organisation summary", category: "admin" },
      { text: "User count by role", category: "admin" },
      { text: "Recent audit log entries", category: "admin" }
    ];
  }
  
  // Network Standards
  if (path === '/network-standards') {
    return [
      { text: "Show network standards status", category: "quality" },
      { text: "Standards compliance summary", category: "quality" }
    ];
  }
  
  // Deleted Items
  if (path === '/deleted-items') {
    return [
      { text: "Show recently deleted items", category: "admin" },
      { text: "What was deleted this week?", category: "admin" }
    ];
  }
  
  // Default - general questions
  return [
    { text: "What's the budget status?", category: "budget" },
    { text: "Show project overview", category: "overview" }
  ];
}

/**
 * Get questions specific to user's role
 */
function getRoleSpecificQuestions(role, context = {}) {
  switch (role) {
    case 'admin':
    case 'supplier_pm':
      return [
        { text: "What needs validation?", category: "workflow" },
        { text: "Show budget vs actual spend", category: "budget" },
        { text: "Resource utilization this month", category: "resources" }
      ];
      
    case 'customer_pm':
      return [
        { text: "What deliverables need review?", category: "deliverables" },
        { text: "Show milestone status", category: "milestones" },
        { text: "What's pending my approval?", category: "workflow" }
      ];
      
    case 'contributor':
      return [
        { text: "Show my pending timesheets", category: "timesheets" },
        { text: "My tasks this week", category: "tasks" },
        { text: "What have I submitted?", category: "workflow" }
      ];
      
    case 'viewer':
    default:
      return [
        { text: "Project overview", category: "overview" },
        { text: "Show dashboard summary", category: "overview" }
      ];
  }
}

/**
 * Get category icon name for a question category
 */
export function getCategoryIcon(category) {
  const icons = {
    actions: 'CheckSquare',
    overview: 'LayoutDashboard',
    budget: 'DollarSign',
    milestones: 'Flag',
    deliverables: 'FileText',
    timesheets: 'Clock',
    expenses: 'Receipt',
    resources: 'Users',
    partners: 'Building2',
    kpis: 'Target',
    raid: 'AlertTriangle',
    quality: 'Shield',
    timeline: 'Calendar',
    workflow: 'GitBranch',
    tasks: 'ListTodo',
    planning: 'GitBranch',
    estimates: 'Calculator',
    rates: 'PoundSterling',
    variations: 'GitPullRequest',
    // Segment 7-10 additions
    invoices: 'FileText',
    evaluator: 'ClipboardCheck',
    // Segment 12 additions
    admin: 'Settings',
    calendar: 'Calendar',
    reports: 'FileBarChart'
  };
  
  return icons[category] || 'MessageCircle';
}

/**
 * Check if a message contains a date-related query
 * Used to suggest date picker
 */
export function containsDateQuery(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  
  const datePatterns = [
    /this (week|month|quarter|year)/i,
    /last (week|month|quarter|year)/i,
    /(january|february|march|april|may|june|july|august|september|october|november|december)/i,
    /q[1-4]/i,
    /\d{4}/,
    /past \d+ (day|week|month)/i,
    /(from|between|since|until|before|after)/i,
    /when|date|period|time(frame|line)?/i
  ];
  
  return datePatterns.some(p => p.test(lower));
}

export default {
  getSuggestedQuestions,
  getCategoryIcon,
  containsDateQuery
};
