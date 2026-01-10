/**
 * RisksService
 * Part of: Evaluator Product Roadmap v1.0.x - Feature 0.9: Risk Dashboard
 *
 * Manages procurement risks and issues throughout the evaluation lifecycle.
 * Includes risk assessment, mitigation tracking, and issue resolution.
 */

import { supabase } from '../../lib/supabase';

// Risk categories
export const RISK_CATEGORIES = {
  INTEGRATION: 'integration',
  VENDOR_VIABILITY: 'vendor_viability',
  IMPLEMENTATION: 'implementation',
  COMMERCIAL: 'commercial',
  TECHNICAL: 'technical',
  COMPLIANCE: 'compliance',
  SECURITY: 'security',
  OPERATIONAL: 'operational',
  RESOURCE: 'resource',
  TIMELINE: 'timeline',
  SCOPE: 'scope',
  STAKEHOLDER: 'stakeholder',
};

export const RISK_CATEGORY_CONFIG = {
  [RISK_CATEGORIES.INTEGRATION]: { label: 'Integration', color: '#8b5cf6', icon: 'link' },
  [RISK_CATEGORIES.VENDOR_VIABILITY]: { label: 'Vendor Viability', color: '#f59e0b', icon: 'building' },
  [RISK_CATEGORIES.IMPLEMENTATION]: { label: 'Implementation', color: '#3b82f6', icon: 'settings' },
  [RISK_CATEGORIES.COMMERCIAL]: { label: 'Commercial', color: '#10b981', icon: 'dollar-sign' },
  [RISK_CATEGORIES.TECHNICAL]: { label: 'Technical', color: '#6366f1', icon: 'cpu' },
  [RISK_CATEGORIES.COMPLIANCE]: { label: 'Compliance', color: '#ec4899', icon: 'shield' },
  [RISK_CATEGORIES.SECURITY]: { label: 'Security', color: '#ef4444', icon: 'lock' },
  [RISK_CATEGORIES.OPERATIONAL]: { label: 'Operational', color: '#14b8a6', icon: 'activity' },
  [RISK_CATEGORIES.RESOURCE]: { label: 'Resource', color: '#f97316', icon: 'users' },
  [RISK_CATEGORIES.TIMELINE]: { label: 'Timeline', color: '#0ea5e9', icon: 'clock' },
  [RISK_CATEGORIES.SCOPE]: { label: 'Scope', color: '#a855f7', icon: 'maximize' },
  [RISK_CATEGORIES.STAKEHOLDER]: { label: 'Stakeholder', color: '#64748b', icon: 'user-check' },
};

// Probability levels
export const PROBABILITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

export const PROBABILITY_CONFIG = {
  [PROBABILITY_LEVELS.LOW]: { label: 'Low', value: 1, color: '#10b981' },
  [PROBABILITY_LEVELS.MEDIUM]: { label: 'Medium', value: 2, color: '#f59e0b' },
  [PROBABILITY_LEVELS.HIGH]: { label: 'High', value: 3, color: '#ef4444' },
};

// Impact levels
export const IMPACT_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

export const IMPACT_CONFIG = {
  [IMPACT_LEVELS.LOW]: { label: 'Low', value: 1, color: '#10b981' },
  [IMPACT_LEVELS.MEDIUM]: { label: 'Medium', value: 2, color: '#f59e0b' },
  [IMPACT_LEVELS.HIGH]: { label: 'High', value: 3, color: '#ef4444' },
};

// Risk levels (derived from score)
export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const RISK_LEVEL_CONFIG = {
  [RISK_LEVELS.LOW]: { label: 'Low', scoreRange: [1, 1], color: '#10b981', bgColor: '#d1fae5' },
  [RISK_LEVELS.MEDIUM]: { label: 'Medium', scoreRange: [2, 3], color: '#f59e0b', bgColor: '#fef3c7' },
  [RISK_LEVELS.HIGH]: { label: 'High', scoreRange: [4, 5], color: '#f97316', bgColor: '#ffedd5' },
  [RISK_LEVELS.CRITICAL]: { label: 'Critical', scoreRange: [6, 9], color: '#ef4444', bgColor: '#fee2e2' },
};

// Mitigation statuses
export const MITIGATION_STATUSES = {
  IDENTIFIED: 'identified',
  ANALYZING: 'analyzing',
  PLANNING: 'planning',
  IN_PROGRESS: 'in_progress',
  MONITORING: 'monitoring',
  CLOSED: 'closed',
  ACCEPTED: 'accepted',
};

export const MITIGATION_STATUS_CONFIG = {
  [MITIGATION_STATUSES.IDENTIFIED]: { label: 'Identified', color: '#6b7280' },
  [MITIGATION_STATUSES.ANALYZING]: { label: 'Analyzing', color: '#8b5cf6' },
  [MITIGATION_STATUSES.PLANNING]: { label: 'Planning', color: '#3b82f6' },
  [MITIGATION_STATUSES.IN_PROGRESS]: { label: 'In Progress', color: '#f59e0b' },
  [MITIGATION_STATUSES.MONITORING]: { label: 'Monitoring', color: '#10b981' },
  [MITIGATION_STATUSES.CLOSED]: { label: 'Closed', color: '#6b7280' },
  [MITIGATION_STATUSES.ACCEPTED]: { label: 'Accepted', color: '#64748b' },
};

// Issue categories
export const ISSUE_CATEGORIES = {
  VENDOR: 'vendor',
  TECHNICAL: 'technical',
  COMMERCIAL: 'commercial',
  PROCESS: 'process',
  STAKEHOLDER: 'stakeholder',
  TIMELINE: 'timeline',
  RESOURCE: 'resource',
  COMPLIANCE: 'compliance',
  COMMUNICATION: 'communication',
  QUALITY: 'quality',
  OTHER: 'other',
};

export const ISSUE_CATEGORY_CONFIG = {
  [ISSUE_CATEGORIES.VENDOR]: { label: 'Vendor', color: '#f59e0b' },
  [ISSUE_CATEGORIES.TECHNICAL]: { label: 'Technical', color: '#6366f1' },
  [ISSUE_CATEGORIES.COMMERCIAL]: { label: 'Commercial', color: '#10b981' },
  [ISSUE_CATEGORIES.PROCESS]: { label: 'Process', color: '#3b82f6' },
  [ISSUE_CATEGORIES.STAKEHOLDER]: { label: 'Stakeholder', color: '#64748b' },
  [ISSUE_CATEGORIES.TIMELINE]: { label: 'Timeline', color: '#0ea5e9' },
  [ISSUE_CATEGORIES.RESOURCE]: { label: 'Resource', color: '#f97316' },
  [ISSUE_CATEGORIES.COMPLIANCE]: { label: 'Compliance', color: '#ec4899' },
  [ISSUE_CATEGORIES.COMMUNICATION]: { label: 'Communication', color: '#8b5cf6' },
  [ISSUE_CATEGORIES.QUALITY]: { label: 'Quality', color: '#ef4444' },
  [ISSUE_CATEGORIES.OTHER]: { label: 'Other', color: '#6b7280' },
};

// Issue priorities
export const ISSUE_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const ISSUE_PRIORITY_CONFIG = {
  [ISSUE_PRIORITIES.LOW]: { label: 'Low', color: '#10b981' },
  [ISSUE_PRIORITIES.MEDIUM]: { label: 'Medium', color: '#f59e0b' },
  [ISSUE_PRIORITIES.HIGH]: { label: 'High', color: '#f97316' },
  [ISSUE_PRIORITIES.CRITICAL]: { label: 'Critical', color: '#ef4444' },
};

// Issue statuses
export const ISSUE_STATUSES = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  BLOCKED: 'blocked',
  PENDING_REVIEW: 'pending_review',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

export const ISSUE_STATUS_CONFIG = {
  [ISSUE_STATUSES.OPEN]: { label: 'Open', color: '#ef4444' },
  [ISSUE_STATUSES.IN_PROGRESS]: { label: 'In Progress', color: '#f59e0b' },
  [ISSUE_STATUSES.BLOCKED]: { label: 'Blocked', color: '#dc2626' },
  [ISSUE_STATUSES.PENDING_REVIEW]: { label: 'Pending Review', color: '#3b82f6' },
  [ISSUE_STATUSES.RESOLVED]: { label: 'Resolved', color: '#10b981' },
  [ISSUE_STATUSES.CLOSED]: { label: 'Closed', color: '#6b7280' },
};

// Comment types
export const COMMENT_TYPES = {
  UPDATE: 'update',
  ASSESSMENT: 'assessment',
  MITIGATION: 'mitigation',
  ESCALATION: 'escalation',
  RESOLUTION: 'resolution',
  QUESTION: 'question',
  DECISION: 'decision',
};

class RisksService {
  // ============================================================================
  // RISKS CRUD
  // ============================================================================

  /**
   * Get all risks for a project
   */
  async getRisks(evaluationProjectId, options = {}) {
    const {
      category,
      riskLevel,
      status,
      vendorId,
      ownerId,
      includeClosed = false,
    } = options;

    let query = supabase
      .from('procurement_risks')
      .select(`
        *,
        vendors(id, name),
        requirements(id, title),
        mitigation_owner:profiles!mitigation_owner_id(id, full_name),
        identified_by_profile:profiles!identified_by(id, full_name)
      `)
      .eq('evaluation_project_id', evaluationProjectId)
      .order('risk_score', { ascending: false })
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('risk_category', category);
    }

    if (riskLevel) {
      query = query.eq('risk_level', riskLevel);
    }

    if (status) {
      query = query.eq('mitigation_status', status);
    } else if (!includeClosed) {
      query = query.not('mitigation_status', 'in', '("closed","accepted")');
    }

    if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    }

    if (ownerId) {
      query = query.eq('mitigation_owner_id', ownerId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Get risk by ID
   */
  async getRiskById(riskId) {
    const { data, error } = await supabase
      .from('procurement_risks')
      .select(`
        *,
        vendors(id, name),
        requirements(id, title),
        mitigation_owner:profiles!mitigation_owner_id(id, full_name),
        identified_by_profile:profiles!identified_by(id, full_name)
      `)
      .eq('id', riskId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create a new risk
   */
  async createRisk(riskData) {
    const { data, error } = await supabase
      .from('procurement_risks')
      .insert(riskData)
      .select()
      .single();

    if (error) throw error;

    // Log creation
    await this.logAudit(data.id, null, 'created', null, null, null, riskData.identified_by);

    return data;
  }

  /**
   * Update a risk
   */
  async updateRisk(riskId, updates, userId = null) {
    // Get current state for audit
    const current = await this.getRiskById(riskId);

    const { data, error } = await supabase
      .from('procurement_risks')
      .update(updates)
      .eq('id', riskId)
      .select()
      .single();

    if (error) throw error;

    // Log significant changes
    if (updates.mitigation_status && updates.mitigation_status !== current.mitigation_status) {
      await this.logAudit(riskId, null, 'status_changed', 'mitigation_status', current.mitigation_status, updates.mitigation_status, userId);
    }
    if (updates.probability && updates.probability !== current.probability) {
      await this.logAudit(riskId, null, 'probability_changed', 'probability', current.probability, updates.probability, userId);
    }
    if (updates.impact && updates.impact !== current.impact) {
      await this.logAudit(riskId, null, 'impact_changed', 'impact', current.impact, updates.impact, userId);
    }

    return data;
  }

  /**
   * Update risk status
   */
  async updateRiskStatus(riskId, status, userId = null) {
    return this.updateRisk(riskId, { mitigation_status: status }, userId);
  }

  /**
   * Close a risk
   */
  async closeRisk(riskId, userId = null) {
    const result = await this.updateRiskStatus(riskId, MITIGATION_STATUSES.CLOSED, userId);
    await this.logAudit(riskId, null, 'closed', null, null, null, userId);
    return result;
  }

  /**
   * Accept a risk
   */
  async acceptRisk(riskId, userId = null) {
    return this.updateRiskStatus(riskId, MITIGATION_STATUSES.ACCEPTED, userId);
  }

  /**
   * Delete a risk
   */
  async deleteRisk(riskId) {
    const { error } = await supabase
      .from('procurement_risks')
      .delete()
      .eq('id', riskId);

    if (error) throw error;
    return true;
  }

  // ============================================================================
  // ISSUES CRUD
  // ============================================================================

  /**
   * Get all issues for a project
   */
  async getIssues(evaluationProjectId, options = {}) {
    const {
      category,
      priority,
      status,
      vendorId,
      ownerId,
      includeClosed = false,
    } = options;

    let query = supabase
      .from('procurement_issues')
      .select(`
        *,
        vendors(id, name),
        procurement_risks(id, risk_title),
        resolution_owner:profiles!resolution_owner_id(id, full_name),
        reported_by_profile:profiles!reported_by(id, full_name),
        resolved_by_profile:profiles!resolved_by(id, full_name)
      `)
      .eq('evaluation_project_id', evaluationProjectId)
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('issue_category', category);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (status) {
      query = query.eq('status', status);
    } else if (!includeClosed) {
      query = query.not('status', 'in', '("resolved","closed")');
    }

    if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    }

    if (ownerId) {
      query = query.eq('resolution_owner_id', ownerId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Get issue by ID
   */
  async getIssueById(issueId) {
    const { data, error } = await supabase
      .from('procurement_issues')
      .select(`
        *,
        vendors(id, name),
        procurement_risks(id, risk_title),
        resolution_owner:profiles!resolution_owner_id(id, full_name),
        reported_by_profile:profiles!reported_by(id, full_name),
        resolved_by_profile:profiles!resolved_by(id, full_name)
      `)
      .eq('id', issueId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create a new issue
   */
  async createIssue(issueData) {
    const { data, error } = await supabase
      .from('procurement_issues')
      .insert(issueData)
      .select()
      .single();

    if (error) throw error;

    // Log creation
    await this.logAudit(null, data.id, 'created', null, null, null, issueData.reported_by);

    return data;
  }

  /**
   * Update an issue
   */
  async updateIssue(issueId, updates, userId = null) {
    // Get current state for audit
    const current = await this.getIssueById(issueId);

    const { data, error } = await supabase
      .from('procurement_issues')
      .update(updates)
      .eq('id', issueId)
      .select()
      .single();

    if (error) throw error;

    // Log status changes
    if (updates.status && updates.status !== current.status) {
      await this.logAudit(null, issueId, 'status_changed', 'status', current.status, updates.status, userId);
    }

    return data;
  }

  /**
   * Update issue status
   */
  async updateIssueStatus(issueId, status, userId = null) {
    const updates = { status };

    if (status === ISSUE_STATUSES.RESOLVED) {
      updates.resolved_at = new Date().toISOString();
      updates.resolved_by = userId;
    }

    return this.updateIssue(issueId, updates, userId);
  }

  /**
   * Resolve an issue
   */
  async resolveIssue(issueId, resolutionNote, userId = null) {
    return this.updateIssue(issueId, {
      status: ISSUE_STATUSES.RESOLVED,
      resolution_note: resolutionNote,
      resolved_at: new Date().toISOString(),
      resolved_by: userId,
    }, userId);
  }

  /**
   * Close an issue
   */
  async closeIssue(issueId, userId = null) {
    return this.updateIssueStatus(issueId, ISSUE_STATUSES.CLOSED, userId);
  }

  /**
   * Delete an issue
   */
  async deleteIssue(issueId) {
    const { error } = await supabase
      .from('procurement_issues')
      .delete()
      .eq('id', issueId);

    if (error) throw error;
    return true;
  }

  // ============================================================================
  // COMMENTS
  // ============================================================================

  /**
   * Get comments for a risk
   */
  async getRiskComments(riskId) {
    const { data, error } = await supabase
      .from('risk_comments')
      .select(`
        *,
        author:profiles!author_id(id, full_name)
      `)
      .eq('risk_id', riskId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get comments for an issue
   */
  async getIssueComments(issueId) {
    const { data, error } = await supabase
      .from('risk_comments')
      .select(`
        *,
        author:profiles!author_id(id, full_name)
      `)
      .eq('issue_id', issueId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Add a comment
   */
  async addComment(commentData) {
    const { data, error } = await supabase
      .from('risk_comments')
      .insert(commentData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ============================================================================
  // AUDIT LOG
  // ============================================================================

  /**
   * Log an audit entry
   */
  async logAudit(riskId, issueId, action, fieldChanged, oldValue, newValue, changedBy) {
    const { error } = await supabase
      .from('risk_audit_log')
      .insert({
        risk_id: riskId,
        issue_id: issueId,
        action,
        field_changed: fieldChanged,
        old_value: oldValue,
        new_value: newValue,
        changed_by: changedBy,
      });

    if (error) {
      console.error('Error logging audit:', error);
    }
  }

  /**
   * Get audit log for a risk
   */
  async getRiskAuditLog(riskId) {
    const { data, error } = await supabase
      .from('risk_audit_log')
      .select(`
        *,
        changed_by_profile:profiles!changed_by(id, full_name)
      `)
      .eq('risk_id', riskId)
      .order('changed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get audit log for an issue
   */
  async getIssueAuditLog(issueId) {
    const { data, error } = await supabase
      .from('risk_audit_log')
      .select(`
        *,
        changed_by_profile:profiles!changed_by(id, full_name)
      `)
      .eq('issue_id', issueId)
      .order('changed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // ============================================================================
  // STATISTICS & DASHBOARD
  // ============================================================================

  /**
   * Get risk statistics for a project
   */
  async getRiskStats(evaluationProjectId) {
    const risks = await this.getRisks(evaluationProjectId, { includeClosed: true });

    const stats = {
      total: risks.length,
      activeCount: 0,
      closedCount: 0,
      byLevel: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
      byCategory: {},
      byStatus: {},
      byVendor: {},
      overdue: 0,
      dueSoon: 0,  // Due within 7 days
    };

    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    risks.forEach(risk => {
      // Active vs Closed
      if (['closed', 'accepted'].includes(risk.mitigation_status)) {
        stats.closedCount++;
      } else {
        stats.activeCount++;
      }

      // By level
      if (risk.risk_level) {
        stats.byLevel[risk.risk_level]++;
      }

      // By category
      stats.byCategory[risk.risk_category] = (stats.byCategory[risk.risk_category] || 0) + 1;

      // By status
      stats.byStatus[risk.mitigation_status] = (stats.byStatus[risk.mitigation_status] || 0) + 1;

      // By vendor
      if (risk.vendor_id) {
        const vendorName = risk.vendors?.name || 'Unknown';
        if (!stats.byVendor[vendorName]) {
          stats.byVendor[vendorName] = { total: 0, critical: 0, high: 0 };
        }
        stats.byVendor[vendorName].total++;
        if (risk.risk_level === 'critical') stats.byVendor[vendorName].critical++;
        if (risk.risk_level === 'high') stats.byVendor[vendorName].high++;
      }

      // Overdue and due soon
      if (risk.mitigation_due_date && !['closed', 'accepted'].includes(risk.mitigation_status)) {
        const dueDate = new Date(risk.mitigation_due_date);
        if (dueDate < now) {
          stats.overdue++;
        } else if (dueDate <= weekFromNow) {
          stats.dueSoon++;
        }
      }
    });

    return stats;
  }

  /**
   * Get issue statistics for a project
   */
  async getIssueStats(evaluationProjectId) {
    const issues = await this.getIssues(evaluationProjectId, { includeClosed: true });

    const stats = {
      total: issues.length,
      openCount: 0,
      resolvedCount: 0,
      byPriority: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
      byCategory: {},
      byStatus: {},
      overdue: 0,
      dueSoon: 0,
    };

    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    issues.forEach(issue => {
      // Open vs Resolved
      if (['resolved', 'closed'].includes(issue.status)) {
        stats.resolvedCount++;
      } else {
        stats.openCount++;
      }

      // By priority
      if (issue.priority) {
        stats.byPriority[issue.priority]++;
      }

      // By category
      stats.byCategory[issue.issue_category] = (stats.byCategory[issue.issue_category] || 0) + 1;

      // By status
      stats.byStatus[issue.status] = (stats.byStatus[issue.status] || 0) + 1;

      // Overdue and due soon
      if (issue.resolution_due_date && !['resolved', 'closed'].includes(issue.status)) {
        const dueDate = new Date(issue.resolution_due_date);
        if (dueDate < now) {
          stats.overdue++;
        } else if (dueDate <= weekFromNow) {
          stats.dueSoon++;
        }
      }
    });

    return stats;
  }

  /**
   * Get combined dashboard data
   */
  async getDashboardData(evaluationProjectId) {
    const [risks, issues, riskStats, issueStats] = await Promise.all([
      this.getRisks(evaluationProjectId, { includeClosed: false }),
      this.getIssues(evaluationProjectId, { includeClosed: false }),
      this.getRiskStats(evaluationProjectId),
      this.getIssueStats(evaluationProjectId),
    ]);

    // Get top risks (critical and high)
    const topRisks = risks
      .filter(r => ['critical', 'high'].includes(r.risk_level))
      .slice(0, 5);

    // Get urgent issues (critical and high priority, open)
    const urgentIssues = issues
      .filter(i => ['critical', 'high'].includes(i.priority) && !['resolved', 'closed'].includes(i.status))
      .slice(0, 5);

    // Build risk matrix data
    const riskMatrix = this.buildRiskMatrix(risks);

    return {
      riskStats,
      issueStats,
      topRisks,
      urgentIssues,
      riskMatrix,
      recentRisks: risks.slice(0, 10),
      recentIssues: issues.slice(0, 10),
    };
  }

  /**
   * Build risk matrix (probability x impact grid)
   */
  buildRiskMatrix(risks) {
    // Initialize 3x3 matrix
    const matrix = {
      // [probability][impact] = { count, risks }
      high: { high: [], medium: [], low: [] },
      medium: { high: [], medium: [], low: [] },
      low: { high: [], medium: [], low: [] },
    };

    risks.forEach(risk => {
      if (!['closed', 'accepted'].includes(risk.mitigation_status)) {
        const prob = risk.probability || 'medium';
        const imp = risk.impact || 'medium';
        matrix[prob][imp].push({
          id: risk.id,
          title: risk.risk_title,
          category: risk.risk_category,
        });
      }
    });

    return matrix;
  }

  // ============================================================================
  // RISK HELPERS
  // ============================================================================

  /**
   * Calculate risk score
   */
  calculateRiskScore(probability, impact) {
    const probValue = PROBABILITY_CONFIG[probability]?.value || 2;
    const impactValue = IMPACT_CONFIG[impact]?.value || 2;
    return probValue * impactValue;
  }

  /**
   * Get risk level from score
   */
  getRiskLevelFromScore(score) {
    if (score >= 6) return RISK_LEVELS.CRITICAL;
    if (score >= 4) return RISK_LEVELS.HIGH;
    if (score >= 2) return RISK_LEVELS.MEDIUM;
    return RISK_LEVELS.LOW;
  }
}

export const risksService = new RisksService();
export default risksService;
