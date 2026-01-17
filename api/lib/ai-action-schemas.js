// AI Action Schemas
// Version 1.0 - January 2026
// Defines available actions for AI chat assistant to execute
// All actions require explicit user confirmation before execution

/**
 * Action Categories:
 * - timesheets: Submit, add comments
 * - expenses: Submit, add notes
 * - milestones: Update status, progress, dates
 * - deliverables: Update status, signoff state
 * - tasks: Complete, update progress, reassign
 * - raid: Update status, assign owner, resolve
 */

// Permission mappings for each action
export const ACTION_PERMISSIONS = {
  // Timesheet actions
  submitTimesheet: { resource: 'timesheets', action: 'submit' },
  submitAllTimesheets: { resource: 'timesheets', action: 'submit' },

  // Expense actions
  submitExpense: { resource: 'expenses', action: 'submit' },
  submitAllExpenses: { resource: 'expenses', action: 'submit' },

  // Milestone actions
  updateMilestoneStatus: { resource: 'milestones', action: 'edit' },
  updateMilestoneProgress: { resource: 'milestones', action: 'edit' },

  // Deliverable actions
  updateDeliverableStatus: { resource: 'deliverables', action: 'edit' },

  // Task actions
  completeTask: { resource: 'tasks', action: 'edit' },
  updateTaskProgress: { resource: 'tasks', action: 'edit' },
  reassignTask: { resource: 'tasks', action: 'edit' },

  // RAID actions
  updateRaidStatus: { resource: 'raid', action: 'edit' },
  resolveRaidItem: { resource: 'raid', action: 'edit' },
  assignRaidOwner: { resource: 'raid', action: 'edit' },
};

// Tool definitions for Claude (added to TOOLS array in chat.js)
export const ACTION_TOOLS = [
  // ==========================================
  // TIMESHEET ACTIONS
  // ==========================================
  {
    name: "submitTimesheet",
    description: "Submit a single draft timesheet for approval. The timesheet must be in Draft status and belong to the current user. Returns a confirmation preview first, then executes when confirmed.",
    input_schema: {
      type: "object",
      properties: {
        timesheetId: {
          type: "string",
          description: "The ID of the timesheet to submit"
        },
        confirmed: {
          type: "boolean",
          description: "Set to true only after user explicitly confirms the action"
        }
      },
      required: ["timesheetId"]
    }
  },
  {
    name: "submitAllTimesheets",
    description: "Submit all of the current user's draft timesheets for approval. Use when user says 'submit all my timesheets' or 'submit my timesheets for this week'. Returns a confirmation preview showing all timesheets that will be submitted.",
    input_schema: {
      type: "object",
      properties: {
        dateRange: {
          type: "string",
          enum: ["thisWeek", "lastWeek", "thisMonth", "all"],
          description: "Optional date range filter. Default is 'all' draft timesheets."
        },
        confirmed: {
          type: "boolean",
          description: "Set to true only after user explicitly confirms the action"
        }
      },
      required: []
    }
  },

  // ==========================================
  // EXPENSE ACTIONS
  // ==========================================
  {
    name: "submitExpense",
    description: "Submit a single draft expense for approval. The expense must be in Draft status and belong to the current user.",
    input_schema: {
      type: "object",
      properties: {
        expenseId: {
          type: "string",
          description: "The ID of the expense to submit"
        },
        confirmed: {
          type: "boolean",
          description: "Set to true only after user explicitly confirms the action"
        }
      },
      required: ["expenseId"]
    }
  },
  {
    name: "submitAllExpenses",
    description: "Submit all of the current user's draft expenses for approval. Use when user says 'submit all my expenses' or 'submit my expenses'.",
    input_schema: {
      type: "object",
      properties: {
        dateRange: {
          type: "string",
          enum: ["thisWeek", "lastWeek", "thisMonth", "all"],
          description: "Optional date range filter. Default is 'all' draft expenses."
        },
        confirmed: {
          type: "boolean",
          description: "Set to true only after user explicitly confirms the action"
        }
      },
      required: []
    }
  },

  // ==========================================
  // MILESTONE ACTIONS
  // ==========================================
  {
    name: "updateMilestoneStatus",
    description: "Update a milestone's status. Use when user says 'mark milestone X as done' or 'set milestone X to in progress'. Valid statuses: Not Started, In Progress, Completed.",
    input_schema: {
      type: "object",
      properties: {
        milestoneIdentifier: {
          type: "string",
          description: "The milestone name or ID to update"
        },
        newStatus: {
          type: "string",
          enum: ["Not Started", "In Progress", "Completed"],
          description: "The new status for the milestone"
        },
        confirmed: {
          type: "boolean",
          description: "Set to true only after user explicitly confirms the action"
        }
      },
      required: ["milestoneIdentifier", "newStatus"]
    }
  },
  {
    name: "updateMilestoneProgress",
    description: "Update a milestone's progress percentage. Use when user says 'set milestone X progress to 50%' or 'update milestone X to 75% complete'.",
    input_schema: {
      type: "object",
      properties: {
        milestoneIdentifier: {
          type: "string",
          description: "The milestone name or ID to update"
        },
        progress: {
          type: "integer",
          minimum: 0,
          maximum: 100,
          description: "The new progress percentage (0-100)"
        },
        confirmed: {
          type: "boolean",
          description: "Set to true only after user explicitly confirms the action"
        }
      },
      required: ["milestoneIdentifier", "progress"]
    }
  },

  // ==========================================
  // DELIVERABLE ACTIONS
  // ==========================================
  {
    name: "updateDeliverableStatus",
    description: "Update a deliverable's status. Valid statuses: Not Started, In Progress, Submitted for Review, Review Complete, Delivered.",
    input_schema: {
      type: "object",
      properties: {
        deliverableIdentifier: {
          type: "string",
          description: "The deliverable name or ID to update"
        },
        newStatus: {
          type: "string",
          enum: ["Not Started", "In Progress", "Submitted for Review", "Review Complete", "Delivered"],
          description: "The new status for the deliverable"
        },
        confirmed: {
          type: "boolean",
          description: "Set to true only after user explicitly confirms the action"
        }
      },
      required: ["deliverableIdentifier", "newStatus"]
    }
  },

  // ==========================================
  // TASK ACTIONS
  // ==========================================
  {
    name: "completeTask",
    description: "Mark a task as complete. Sets status to Complete and progress to 100%.",
    input_schema: {
      type: "object",
      properties: {
        taskIdentifier: {
          type: "string",
          description: "The task name or ID to complete"
        },
        confirmed: {
          type: "boolean",
          description: "Set to true only after user explicitly confirms the action"
        }
      },
      required: ["taskIdentifier"]
    }
  },
  {
    name: "updateTaskProgress",
    description: "Update a task's progress percentage.",
    input_schema: {
      type: "object",
      properties: {
        taskIdentifier: {
          type: "string",
          description: "The task name or ID to update"
        },
        progress: {
          type: "integer",
          minimum: 0,
          maximum: 100,
          description: "The new progress percentage (0-100)"
        },
        confirmed: {
          type: "boolean",
          description: "Set to true only after user explicitly confirms the action"
        }
      },
      required: ["taskIdentifier", "progress"]
    }
  },
  {
    name: "reassignTask",
    description: "Reassign a task to a different resource/person.",
    input_schema: {
      type: "object",
      properties: {
        taskIdentifier: {
          type: "string",
          description: "The task name or ID to reassign"
        },
        newAssignee: {
          type: "string",
          description: "The name of the person to assign the task to"
        },
        confirmed: {
          type: "boolean",
          description: "Set to true only after user explicitly confirms the action"
        }
      },
      required: ["taskIdentifier", "newAssignee"]
    }
  },

  // ==========================================
  // RAID ACTIONS
  // ==========================================
  {
    name: "updateRaidStatus",
    description: "Update a RAID item's status. Valid statuses: Open, In Progress, Mitigated, Closed.",
    input_schema: {
      type: "object",
      properties: {
        raidIdentifier: {
          type: "string",
          description: "The RAID item reference (e.g., R-001, I-023) or title"
        },
        newStatus: {
          type: "string",
          enum: ["Open", "In Progress", "Mitigated", "Closed"],
          description: "The new status for the RAID item"
        },
        note: {
          type: "string",
          description: "Optional note to add explaining the status change"
        },
        confirmed: {
          type: "boolean",
          description: "Set to true only after user explicitly confirms the action"
        }
      },
      required: ["raidIdentifier", "newStatus"]
    }
  },
  {
    name: "resolveRaidItem",
    description: "Close/resolve a RAID item with a resolution note. Sets status to Closed.",
    input_schema: {
      type: "object",
      properties: {
        raidIdentifier: {
          type: "string",
          description: "The RAID item reference (e.g., R-001, I-023) or title"
        },
        resolutionNote: {
          type: "string",
          description: "Note explaining how the item was resolved"
        },
        confirmed: {
          type: "boolean",
          description: "Set to true only after user explicitly confirms the action"
        }
      },
      required: ["raidIdentifier"]
    }
  },
  {
    name: "assignRaidOwner",
    description: "Assign or reassign a RAID item to a different owner.",
    input_schema: {
      type: "object",
      properties: {
        raidIdentifier: {
          type: "string",
          description: "The RAID item reference (e.g., R-001, I-023) or title"
        },
        newOwner: {
          type: "string",
          description: "The name of the person to assign as owner"
        },
        confirmed: {
          type: "boolean",
          description: "Set to true only after user explicitly confirms the action"
        }
      },
      required: ["raidIdentifier", "newOwner"]
    }
  },
];

// Human-readable action descriptions for confirmation messages
export const ACTION_DESCRIPTIONS = {
  submitTimesheet: (params, data) =>
    `Submit timesheet for ${data.date}: ${data.hours} hours on ${data.deliverable || 'project work'}`,

  submitAllTimesheets: (params, data) =>
    `Submit ${data.count} timesheet(s) totaling ${data.totalHours} hours`,

  submitExpense: (params, data) =>
    `Submit expense: ${data.description} - ${data.currency}${data.amount}`,

  submitAllExpenses: (params, data) =>
    `Submit ${data.count} expense(s) totaling ${data.currency}${data.totalAmount}`,

  updateMilestoneStatus: (params, data) =>
    `Change milestone "${data.name}" status from ${data.currentStatus} to ${params.newStatus}`,

  updateMilestoneProgress: (params, data) =>
    `Update milestone "${data.name}" progress from ${data.currentProgress}% to ${params.progress}%`,

  updateDeliverableStatus: (params, data) =>
    `Change deliverable "${data.name}" status from ${data.currentStatus} to ${params.newStatus}`,

  completeTask: (params, data) =>
    `Mark task "${data.name}" as complete`,

  updateTaskProgress: (params, data) =>
    `Update task "${data.name}" progress from ${data.currentProgress}% to ${params.progress}%`,

  reassignTask: (params, data) =>
    `Reassign task "${data.name}" from ${data.currentAssignee || 'unassigned'} to ${params.newAssignee}`,

  updateRaidStatus: (params, data) =>
    `Change ${data.type} "${data.title}" status from ${data.currentStatus} to ${params.newStatus}`,

  resolveRaidItem: (params, data) =>
    `Close ${data.type} "${data.title}"${params.resolutionNote ? ` with note: "${params.resolutionNote}"` : ''}`,

  assignRaidOwner: (params, data) =>
    `Reassign ${data.type} "${data.title}" from ${data.currentOwner || 'unassigned'} to ${params.newOwner}`,
};

export default {
  ACTION_PERMISSIONS,
  ACTION_TOOLS,
  ACTION_DESCRIPTIONS,
};
