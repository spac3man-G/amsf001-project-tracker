/**
 * Security Assessment Service
 *
 * Manages multi-stage security assessments including:
 * - Security questionnaire management
 * - Vendor security assessments per stage
 * - Security findings and remediation tracking
 *
 * @version 1.1
 * @created 09 January 2026
 * @updated 09 January 2026 - Added notification triggers
 * @phase Evaluator Roadmap v3.0 - Feature 0.1
 */

import { EvaluatorBaseService } from './base.evaluator.service';
import { supabase } from '../../lib/supabase';
import { notificationTriggersService } from './notificationTriggers.service';

// Assessment stages
export const SECURITY_STAGES = {
  INITIAL_RFP: 'initial_rfp',
  TECHNICAL_REVIEW: 'technical_review',
  POC_VALIDATION: 'poc_validation'
};

export const SECURITY_STAGE_CONFIG = {
  [SECURITY_STAGES.INITIAL_RFP]: {
    label: 'Initial RFP Security',
    description: 'Basic security questionnaire sent with RFP',
    order: 1,
    typicalDuration: '2 weeks',
    respondent: 'vendor'
  },
  [SECURITY_STAGES.TECHNICAL_REVIEW]: {
    label: 'Technical Security Review',
    description: 'Deep-dive security review for shortlisted vendors',
    order: 2,
    typicalDuration: '8 hours per vendor',
    respondent: 'evaluator'
  },
  [SECURITY_STAGES.POC_VALIDATION]: {
    label: 'POC Security Validation',
    description: 'Final security validation before contract signature',
    order: 3,
    typicalDuration: '2 weeks',
    respondent: 'evaluator'
  }
};

// Assessment status
export const ASSESSMENT_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  WAIVED: 'waived'
};

export const ASSESSMENT_STATUS_CONFIG = {
  [ASSESSMENT_STATUS.PENDING]: { label: 'Pending', color: '#6b7280' },
  [ASSESSMENT_STATUS.IN_PROGRESS]: { label: 'In Progress', color: '#f59e0b' },
  [ASSESSMENT_STATUS.COMPLETED]: { label: 'Completed', color: '#10b981' },
  [ASSESSMENT_STATUS.WAIVED]: { label: 'Waived', color: '#8b5cf6' }
};

// Risk levels
export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

export const RISK_LEVEL_CONFIG = {
  [RISK_LEVELS.LOW]: { label: 'Low', color: '#10b981', threshold: 8 },
  [RISK_LEVELS.MEDIUM]: { label: 'Medium', color: '#f59e0b', threshold: 6 },
  [RISK_LEVELS.HIGH]: { label: 'High', color: '#ef4444', threshold: 4 },
  [RISK_LEVELS.CRITICAL]: { label: 'Critical', color: '#7f1d1d', threshold: 0 }
};

// Finding categories
export const FINDING_CATEGORIES = {
  DATA_PROTECTION: 'data_protection',
  ACCESS_CONTROL: 'access_control',
  ENCRYPTION: 'encryption',
  COMPLIANCE: 'compliance',
  INCIDENT_RESPONSE: 'incident_response',
  INFRASTRUCTURE: 'infrastructure',
  VENDOR_MANAGEMENT: 'vendor_management',
  BUSINESS_CONTINUITY: 'business_continuity',
  OTHER: 'other'
};

export const FINDING_CATEGORY_CONFIG = {
  [FINDING_CATEGORIES.DATA_PROTECTION]: { label: 'Data Protection', icon: 'shield' },
  [FINDING_CATEGORIES.ACCESS_CONTROL]: { label: 'Access Control', icon: 'key' },
  [FINDING_CATEGORIES.ENCRYPTION]: { label: 'Encryption', icon: 'lock' },
  [FINDING_CATEGORIES.COMPLIANCE]: { label: 'Compliance', icon: 'check-square' },
  [FINDING_CATEGORIES.INCIDENT_RESPONSE]: { label: 'Incident Response', icon: 'alert-triangle' },
  [FINDING_CATEGORIES.INFRASTRUCTURE]: { label: 'Infrastructure', icon: 'server' },
  [FINDING_CATEGORIES.VENDOR_MANAGEMENT]: { label: 'Vendor Management', icon: 'users' },
  [FINDING_CATEGORIES.BUSINESS_CONTINUITY]: { label: 'Business Continuity', icon: 'refresh-cw' },
  [FINDING_CATEGORIES.OTHER]: { label: 'Other', icon: 'file' }
};

// Finding status
export const FINDING_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  ACCEPTED: 'accepted',
  WONT_FIX: 'wont_fix'
};

export const FINDING_STATUS_CONFIG = {
  [FINDING_STATUS.OPEN]: { label: 'Open', color: '#ef4444' },
  [FINDING_STATUS.IN_PROGRESS]: { label: 'In Progress', color: '#f59e0b' },
  [FINDING_STATUS.RESOLVED]: { label: 'Resolved', color: '#10b981' },
  [FINDING_STATUS.ACCEPTED]: { label: 'Risk Accepted', color: '#8b5cf6' },
  [FINDING_STATUS.WONT_FIX]: { label: "Won't Fix", color: '#6b7280' }
};

export class SecurityAssessmentService extends EvaluatorBaseService {
  constructor() {
    super('security_assessments', {
      supportsSoftDelete: false
    });
  }

  // ============================================================================
  // QUESTIONNAIRE MANAGEMENT
  // ============================================================================

  /**
   * Create a security questionnaire for a stage
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @param {string} stage - Assessment stage
   * @param {Object} data - Questionnaire data
   * @returns {Promise<Object>} Created questionnaire
   */
  async createQuestionnaire(evaluationProjectId, stage, data) {
    try {
      const { data: questionnaire, error } = await supabase
        .from('security_questionnaires')
        .insert({
          evaluation_project_id: evaluationProjectId,
          stage,
          name: data.name,
          description: data.description,
          questions: data.questions || [],
          send_with_rfp: data.send_with_rfp || false,
          is_template: data.is_template || false,
          created_by: data.created_by
        })
        .select()
        .single();

      if (error) throw error;
      return questionnaire;
    } catch (error) {
      console.error('SecurityAssessmentService createQuestionnaire failed:', error);
      throw error;
    }
  }

  /**
   * Get questionnaires for an evaluation project
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @param {string} stage - Optional stage filter
   * @returns {Promise<Array>} Questionnaires
   */
  async getQuestionnaires(evaluationProjectId, stage = null) {
    try {
      let query = supabase
        .from('security_questionnaires')
        .select('*')
        .eq('evaluation_project_id', evaluationProjectId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('created_at', { ascending: true });

      if (stage) {
        query = query.eq('stage', stage);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('SecurityAssessmentService getQuestionnaires failed:', error);
      throw error;
    }
  }

  /**
   * Update a questionnaire
   * @param {string} questionnaireId - Questionnaire UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated questionnaire
   */
  async updateQuestionnaire(questionnaireId, updates) {
    try {
      const { data, error } = await supabase
        .from('security_questionnaires')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', questionnaireId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('SecurityAssessmentService updateQuestionnaire failed:', error);
      throw error;
    }
  }

  /**
   * Get default questionnaire template for a stage
   * @param {string} stage - Assessment stage
   * @returns {Object} Default questionnaire template
   */
  getDefaultTemplate(stage) {
    return DEFAULT_QUESTIONNAIRE_TEMPLATES[stage] || null;
  }

  // ============================================================================
  // ASSESSMENT MANAGEMENT
  // ============================================================================

  /**
   * Create or get an assessment for a vendor at a stage
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @param {string} vendorId - Vendor UUID
   * @param {string} stage - Assessment stage
   * @param {string} questionnaireId - Optional questionnaire UUID
   * @returns {Promise<Object>} Assessment record
   */
  async getOrCreateAssessment(evaluationProjectId, vendorId, stage, questionnaireId = null) {
    try {
      // Check if assessment exists
      const { data: existing } = await supabase
        .from('security_assessments')
        .select('*')
        .eq('evaluation_project_id', evaluationProjectId)
        .eq('vendor_id', vendorId)
        .eq('stage', stage)
        .single();

      if (existing) {
        return existing;
      }

      // Create new assessment
      const { data: assessment, error } = await supabase
        .from('security_assessments')
        .insert({
          evaluation_project_id: evaluationProjectId,
          vendor_id: vendorId,
          stage,
          questionnaire_id: questionnaireId,
          status: ASSESSMENT_STATUS.PENDING
        })
        .select()
        .single();

      if (error) throw error;
      return assessment;
    } catch (error) {
      console.error('SecurityAssessmentService getOrCreateAssessment failed:', error);
      throw error;
    }
  }

  /**
   * Submit an assessment with score and findings
   * @param {string} assessmentId - Assessment UUID
   * @param {Object} data - Assessment data
   * @returns {Promise<Object>} Updated assessment
   */
  async submitAssessment(assessmentId, data) {
    try {
      const { data: assessment, error } = await supabase
        .from('security_assessments')
        .update({
          score: data.score,
          risk_level: data.risk_level || this.calculateRiskLevel(data.score),
          responses: data.responses || {},
          summary: data.summary,
          strengths: data.strengths || [],
          concerns: data.concerns || [],
          status: ASSESSMENT_STATUS.COMPLETED,
          assessed_by: data.assessed_by,
          assessed_at: new Date().toISOString()
        })
        .eq('id', assessmentId)
        .select()
        .single();

      if (error) throw error;
      return assessment;
    } catch (error) {
      console.error('SecurityAssessmentService submitAssessment failed:', error);
      throw error;
    }
  }

  /**
   * Update assessment status
   * @param {string} assessmentId - Assessment UUID
   * @param {string} status - New status
   * @param {string} waivedReason - Reason if waiving
   * @returns {Promise<Object>} Updated assessment
   */
  async updateAssessmentStatus(assessmentId, status, waivedReason = null) {
    try {
      const updates = { status };
      if (status === ASSESSMENT_STATUS.WAIVED) {
        updates.waived_reason = waivedReason;
      }

      const { data, error } = await supabase
        .from('security_assessments')
        .update(updates)
        .eq('id', assessmentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('SecurityAssessmentService updateAssessmentStatus failed:', error);
      throw error;
    }
  }

  /**
   * Get assessments for an evaluation project
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Assessments with vendor details
   */
  async getAssessments(evaluationProjectId, options = {}) {
    try {
      let query = supabase
        .from('security_assessments')
        .select(`
          *,
          vendor:vendors!vendor_id(id, name, logo_url, status),
          questionnaire:security_questionnaires!questionnaire_id(id, name, stage),
          assessor:profiles!assessed_by(id, full_name, email)
        `)
        .eq('evaluation_project_id', evaluationProjectId)
        .order('stage', { ascending: true });

      if (options.vendorId) {
        query = query.eq('vendor_id', options.vendorId);
      }
      if (options.stage) {
        query = query.eq('stage', options.stage);
      }
      if (options.status) {
        query = query.eq('status', options.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('SecurityAssessmentService getAssessments failed:', error);
      throw error;
    }
  }

  /**
   * Get vendor security summary across all stages
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @param {string} vendorId - Vendor UUID
   * @returns {Promise<Object>} Security summary
   */
  async getVendorSecuritySummary(evaluationProjectId, vendorId) {
    try {
      // Get all assessments for vendor
      const { data: assessments, error: assessError } = await supabase
        .from('security_assessments')
        .select('*')
        .eq('evaluation_project_id', evaluationProjectId)
        .eq('vendor_id', vendorId);

      if (assessError) throw assessError;

      // Get all findings for vendor's assessments
      const assessmentIds = (assessments || []).map(a => a.id);
      let findings = [];

      if (assessmentIds.length > 0) {
        const { data: findingsData, error: findingsError } = await supabase
          .from('security_findings')
          .select('*')
          .in('assessment_id', assessmentIds);

        if (findingsError) throw findingsError;
        findings = findingsData || [];
      }

      // Calculate summary
      const completedAssessments = assessments?.filter(a => a.status === ASSESSMENT_STATUS.COMPLETED) || [];
      const avgScore = completedAssessments.length > 0
        ? completedAssessments.reduce((sum, a) => sum + (a.score || 0), 0) / completedAssessments.length
        : null;

      const openFindings = findings.filter(f => f.status === FINDING_STATUS.OPEN || f.status === FINDING_STATUS.IN_PROGRESS);
      const criticalFindings = findings.filter(f => f.severity === 'critical' && f.status !== FINDING_STATUS.RESOLVED);

      return {
        stages: Object.values(SECURITY_STAGES).map(stage => {
          const assessment = assessments?.find(a => a.stage === stage);
          const stageFindings = findings.filter(f =>
            assessment && f.assessment_id === assessment.id
          );

          return {
            stage,
            config: SECURITY_STAGE_CONFIG[stage],
            assessment: assessment || null,
            findings: stageFindings,
            openFindingsCount: stageFindings.filter(f =>
              f.status === FINDING_STATUS.OPEN || f.status === FINDING_STATUS.IN_PROGRESS
            ).length
          };
        }),
        summary: {
          completedStages: completedAssessments.length,
          totalStages: Object.keys(SECURITY_STAGES).length,
          averageScore: avgScore ? Math.round(avgScore * 10) / 10 : null,
          overallRiskLevel: this.calculateRiskLevel(avgScore),
          totalFindings: findings.length,
          openFindings: openFindings.length,
          criticalFindings: criticalFindings.length
        }
      };
    } catch (error) {
      console.error('SecurityAssessmentService getVendorSecuritySummary failed:', error);
      throw error;
    }
  }

  /**
   * Get overall security status for evaluation project
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @returns {Promise<Object>} Overall security status
   */
  async getSecurityStatus(evaluationProjectId) {
    try {
      const assessments = await this.getAssessments(evaluationProjectId);

      // Group by vendor
      const vendorMap = new Map();
      for (const assessment of assessments) {
        if (!vendorMap.has(assessment.vendor_id)) {
          vendorMap.set(assessment.vendor_id, {
            vendor: assessment.vendor,
            assessments: []
          });
        }
        vendorMap.get(assessment.vendor_id).assessments.push(assessment);
      }

      // Get all findings
      const assessmentIds = assessments.map(a => a.id);
      let allFindings = [];

      if (assessmentIds.length > 0) {
        const { data: findings } = await supabase
          .from('security_findings')
          .select('*')
          .in('assessment_id', assessmentIds);
        allFindings = findings || [];
      }

      // Calculate stats
      const completedCount = assessments.filter(a => a.status === ASSESSMENT_STATUS.COMPLETED).length;
      const pendingCount = assessments.filter(a => a.status === ASSESSMENT_STATUS.PENDING).length;
      const openFindings = allFindings.filter(f =>
        f.status === FINDING_STATUS.OPEN || f.status === FINDING_STATUS.IN_PROGRESS
      );

      return {
        vendors: Array.from(vendorMap.values()),
        totals: {
          totalAssessments: assessments.length,
          completedAssessments: completedCount,
          pendingAssessments: pendingCount,
          totalFindings: allFindings.length,
          openFindings: openFindings.length,
          criticalFindings: allFindings.filter(f => f.severity === 'critical').length,
          highFindings: allFindings.filter(f => f.severity === 'high').length
        },
        findingsByCategory: this.groupFindingsByCategory(allFindings),
        findingsBySeverity: this.groupFindingsBySeverity(allFindings)
      };
    } catch (error) {
      console.error('SecurityAssessmentService getSecurityStatus failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // FINDINGS MANAGEMENT
  // ============================================================================

  /**
   * Add a security finding to an assessment
   * @param {string} assessmentId - Assessment UUID
   * @param {Object} finding - Finding data
   * @returns {Promise<Object>} Created finding
   */
  async addFinding(assessmentId, finding) {
    try {
      const { data, error } = await supabase
        .from('security_findings')
        .insert({
          assessment_id: assessmentId,
          finding_title: finding.title,
          finding_description: finding.description,
          category: finding.category,
          severity: finding.severity,
          evidence: finding.evidence,
          questionnaire_question_id: finding.questionId,
          remediation_required: finding.remediation_required !== false,
          remediation_plan: finding.remediation_plan,
          remediation_owner: finding.remediation_owner,
          remediation_owner_id: finding.remediation_owner_id,
          remediation_due_date: finding.remediation_due_date,
          created_by: finding.created_by
        })
        .select()
        .single();

      if (error) throw error;

      // Notify for critical/high findings
      if (data && (finding.severity === 'critical' || finding.severity === 'high')) {
        this._notifyCriticalFinding(assessmentId, data).catch(
          err => console.error('Finding notification failed:', err)
        );
      }

      return data;
    } catch (error) {
      console.error('SecurityAssessmentService addFinding failed:', error);
      throw error;
    }
  }

  /**
   * Helper to notify team of critical finding
   * @private
   */
  async _notifyCriticalFinding(assessmentId, findingData) {
    // Get assessment with vendor info
    const { data: assessment } = await supabase
      .from('security_assessments')
      .select(`
        evaluation_project_id,
        vendor:vendors!vendor_id(id, name, company_name)
      `)
      .eq('id', assessmentId)
      .single();

    if (assessment && assessment.vendor) {
      await this.notifyCriticalFinding(
        assessment.evaluation_project_id,
        findingData,
        {
          id: assessment.vendor.id,
          name: assessment.vendor.company_name || assessment.vendor.name
        }
      );
    }
  }

  /**
   * Update a finding
   * @param {string} findingId - Finding UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated finding
   */
  async updateFinding(findingId, updates) {
    try {
      const { data, error } = await supabase
        .from('security_findings')
        .update(updates)
        .eq('id', findingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('SecurityAssessmentService updateFinding failed:', error);
      throw error;
    }
  }

  /**
   * Update finding status with resolution tracking
   * @param {string} findingId - Finding UUID
   * @param {string} status - New status
   * @param {string} notes - Status notes
   * @param {string} userId - User making the change
   * @returns {Promise<Object>} Updated finding
   */
  async updateFindingStatus(findingId, status, notes = null, userId = null) {
    try {
      const updates = {
        status,
        status_notes: notes
      };

      if (status === FINDING_STATUS.RESOLVED) {
        updates.resolved_at = new Date().toISOString();
        updates.resolved_by = userId;
      }

      const { data, error } = await supabase
        .from('security_findings')
        .update(updates)
        .eq('id', findingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('SecurityAssessmentService updateFindingStatus failed:', error);
      throw error;
    }
  }

  /**
   * Get findings for an assessment
   * @param {string} assessmentId - Assessment UUID
   * @returns {Promise<Array>} Findings
   */
  async getFindings(assessmentId) {
    try {
      const { data, error } = await supabase
        .from('security_findings')
        .select(`
          *,
          owner:profiles!remediation_owner_id(id, full_name, email),
          resolver:profiles!resolved_by(id, full_name)
        `)
        .eq('assessment_id', assessmentId)
        .order('severity', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('SecurityAssessmentService getFindings failed:', error);
      throw error;
    }
  }

  /**
   * Get all open findings for an evaluation project
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @returns {Promise<Array>} Open findings with assessment and vendor details
   */
  async getOpenFindings(evaluationProjectId) {
    try {
      const assessments = await this.getAssessments(evaluationProjectId);
      const assessmentIds = assessments.map(a => a.id);

      if (assessmentIds.length === 0) return [];

      const { data, error } = await supabase
        .from('security_findings')
        .select(`
          *,
          owner:profiles!remediation_owner_id(id, full_name, email)
        `)
        .in('assessment_id', assessmentIds)
        .in('status', [FINDING_STATUS.OPEN, FINDING_STATUS.IN_PROGRESS])
        .order('severity', { ascending: true })
        .order('remediation_due_date', { ascending: true });

      if (error) throw error;

      // Enrich with assessment/vendor info
      return (data || []).map(finding => {
        const assessment = assessments.find(a => a.id === finding.assessment_id);
        return {
          ...finding,
          assessment: assessment ? {
            id: assessment.id,
            stage: assessment.stage,
            vendor: assessment.vendor
          } : null
        };
      });
    } catch (error) {
      console.error('SecurityAssessmentService getOpenFindings failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Calculate risk level from score
   * @param {number} score - Security score (0-10)
   * @returns {string} Risk level
   */
  calculateRiskLevel(score) {
    if (score === null || score === undefined) return null;
    if (score >= 8) return RISK_LEVELS.LOW;
    if (score >= 6) return RISK_LEVELS.MEDIUM;
    if (score >= 4) return RISK_LEVELS.HIGH;
    return RISK_LEVELS.CRITICAL;
  }

  // ============================================================================
  // NOTIFICATION TRIGGERS
  // ============================================================================

  /**
   * Check for upcoming security review deadlines and send notifications
   * Called by the check-deadlines cron job
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @param {number} daysAhead - Days to look ahead for deadlines
   * @returns {Promise<Array>} Assessments that triggered notifications
   */
  async checkAndNotifyDeadlines(evaluationProjectId, daysAhead = 3) {
    try {
      const now = new Date();
      const futureDate = new Date(now.getTime() + (daysAhead * 24 * 60 * 60 * 1000));

      // Get assessments with upcoming due dates
      const { data: assessments, error } = await supabase
        .from('security_assessments')
        .select(`
          *,
          vendor:vendors!vendor_id(id, name, company_name)
        `)
        .eq('evaluation_project_id', evaluationProjectId)
        .in('status', [ASSESSMENT_STATUS.PENDING, ASSESSMENT_STATUS.IN_PROGRESS])
        .lte('due_date', futureDate.toISOString())
        .gte('due_date', now.toISOString());

      if (error) throw error;

      const notifiedAssessments = [];

      for (const assessment of (assessments || [])) {
        const dueDate = new Date(assessment.due_date);
        const daysLeft = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

        // Only notify at specific intervals: 0, 1, 3 days
        if (daysLeft === 0 || daysLeft === 1 || daysLeft === 3) {
          await notificationTriggersService.onSecurityReviewDue(
            evaluationProjectId,
            {
              id: assessment.id,
              stage: assessment.stage,
              due_date: assessment.due_date,
              pending_items: [] // Could be enhanced to list specific items
            },
            {
              id: assessment.vendor?.id,
              name: assessment.vendor?.company_name || assessment.vendor?.name
            },
            daysLeft
          );

          notifiedAssessments.push(assessment);
        }
      }

      return notifiedAssessments;
    } catch (error) {
      console.error('SecurityAssessmentService checkAndNotifyDeadlines failed:', error);
      throw error;
    }
  }

  /**
   * Notify team when a critical finding is added
   * @param {string} evaluationProjectId - Evaluation project UUID
   * @param {Object} finding - Finding details
   * @param {Object} vendor - Vendor details
   */
  async notifyCriticalFinding(evaluationProjectId, finding, vendor) {
    if (finding.severity === 'critical' || finding.severity === 'high') {
      await notificationTriggersService.onAnomalyDetected(
        evaluationProjectId,
        {
          type: `Security Finding - ${finding.severity.toUpperCase()}`,
          category: finding.category,
          details: finding.finding_title,
          variance: null
        },
        vendor
      );
    }
  }

  /**
   * Group findings by category
   * @param {Array} findings - Findings array
   * @returns {Object} Grouped findings
   */
  groupFindingsByCategory(findings) {
    const grouped = {};
    for (const category of Object.values(FINDING_CATEGORIES)) {
      grouped[category] = findings.filter(f => f.category === category).length;
    }
    return grouped;
  }

  /**
   * Group findings by severity
   * @param {Array} findings - Findings array
   * @returns {Object} Grouped findings
   */
  groupFindingsBySeverity(findings) {
    return {
      critical: findings.filter(f => f.severity === 'critical').length,
      high: findings.filter(f => f.severity === 'high').length,
      medium: findings.filter(f => f.severity === 'medium').length,
      low: findings.filter(f => f.severity === 'low').length
    };
  }
}

// ============================================================================
// DEFAULT QUESTIONNAIRE TEMPLATES
// ============================================================================

const DEFAULT_QUESTIONNAIRE_TEMPLATES = {
  [SECURITY_STAGES.INITIAL_RFP]: {
    name: 'Initial RFP Security Questionnaire',
    description: 'Basic security assessment questions included with RFP',
    questions: [
      {
        id: 'rfp-1',
        category: 'compliance',
        text: 'Does your organization hold SOC 2 Type II certification?',
        required: true,
        response_type: 'yes_no_details'
      },
      {
        id: 'rfp-2',
        category: 'compliance',
        text: 'Does your organization hold ISO 27001 certification?',
        required: true,
        response_type: 'yes_no_details'
      },
      {
        id: 'rfp-3',
        category: 'encryption',
        text: 'What encryption standards do you use for data at rest?',
        required: true,
        response_type: 'text'
      },
      {
        id: 'rfp-4',
        category: 'encryption',
        text: 'What encryption standards do you use for data in transit?',
        required: true,
        response_type: 'text'
      },
      {
        id: 'rfp-5',
        category: 'data_protection',
        text: 'Where is customer data physically stored? (Geographic locations)',
        required: true,
        response_type: 'text'
      },
      {
        id: 'rfp-6',
        category: 'data_protection',
        text: 'What is your data retention policy?',
        required: true,
        response_type: 'text'
      },
      {
        id: 'rfp-7',
        category: 'access_control',
        text: 'Do you support Single Sign-On (SSO) integration?',
        required: true,
        response_type: 'yes_no_details'
      },
      {
        id: 'rfp-8',
        category: 'access_control',
        text: 'Do you support Multi-Factor Authentication (MFA)?',
        required: true,
        response_type: 'yes_no_details'
      },
      {
        id: 'rfp-9',
        category: 'incident_response',
        text: 'What is your SLA for security incident notification?',
        required: true,
        response_type: 'text'
      },
      {
        id: 'rfp-10',
        category: 'incident_response',
        text: 'Describe your incident response process.',
        required: true,
        response_type: 'text'
      },
      {
        id: 'rfp-11',
        category: 'infrastructure',
        text: 'Do you conduct regular penetration testing? If yes, how often?',
        required: true,
        response_type: 'yes_no_details'
      },
      {
        id: 'rfp-12',
        category: 'business_continuity',
        text: 'What is your disaster recovery RTO (Recovery Time Objective)?',
        required: true,
        response_type: 'text'
      },
      {
        id: 'rfp-13',
        category: 'business_continuity',
        text: 'What is your disaster recovery RPO (Recovery Point Objective)?',
        required: true,
        response_type: 'text'
      },
      {
        id: 'rfp-14',
        category: 'vendor_management',
        text: 'Do you use any sub-processors for data processing? If yes, list them.',
        required: true,
        response_type: 'text'
      },
      {
        id: 'rfp-15',
        category: 'compliance',
        text: 'Are you GDPR compliant?',
        required: true,
        response_type: 'yes_no_details'
      }
    ]
  },
  [SECURITY_STAGES.TECHNICAL_REVIEW]: {
    name: 'Technical Security Review Checklist',
    description: 'Deep-dive security review for shortlisted vendors',
    questions: [
      {
        id: 'tech-1',
        category: 'infrastructure',
        text: 'Review architecture diagram for security layers',
        required: true,
        response_type: 'evaluator_score'
      },
      {
        id: 'tech-2',
        category: 'infrastructure',
        text: 'Verify network segmentation and firewall rules',
        required: true,
        response_type: 'evaluator_score'
      },
      {
        id: 'tech-3',
        category: 'access_control',
        text: 'Review IAM policies and role-based access control implementation',
        required: true,
        response_type: 'evaluator_score'
      },
      {
        id: 'tech-4',
        category: 'encryption',
        text: 'Verify encryption key management practices',
        required: true,
        response_type: 'evaluator_score'
      },
      {
        id: 'tech-5',
        category: 'compliance',
        text: 'Review most recent penetration test report',
        required: true,
        response_type: 'evaluator_score'
      },
      {
        id: 'tech-6',
        category: 'compliance',
        text: 'Review SOC 2 Type II report findings',
        required: false,
        response_type: 'evaluator_score'
      },
      {
        id: 'tech-7',
        category: 'incident_response',
        text: 'Review incident response playbook',
        required: true,
        response_type: 'evaluator_score'
      },
      {
        id: 'tech-8',
        category: 'data_protection',
        text: 'Verify data classification and handling procedures',
        required: true,
        response_type: 'evaluator_score'
      },
      {
        id: 'tech-9',
        category: 'infrastructure',
        text: 'Review logging and monitoring capabilities',
        required: true,
        response_type: 'evaluator_score'
      },
      {
        id: 'tech-10',
        category: 'vendor_management',
        text: 'Review third-party vendor security assessment process',
        required: true,
        response_type: 'evaluator_score'
      }
    ]
  },
  [SECURITY_STAGES.POC_VALIDATION]: {
    name: 'POC Security Validation Checklist',
    description: 'Final security validation during proof-of-concept',
    questions: [
      {
        id: 'poc-1',
        category: 'encryption',
        text: 'Verify TLS configuration in sandbox environment',
        required: true,
        response_type: 'evaluator_score'
      },
      {
        id: 'poc-2',
        category: 'access_control',
        text: 'Test SSO integration and session management',
        required: true,
        response_type: 'evaluator_score'
      },
      {
        id: 'poc-3',
        category: 'access_control',
        text: 'Test MFA enforcement and bypass scenarios',
        required: true,
        response_type: 'evaluator_score'
      },
      {
        id: 'poc-4',
        category: 'data_protection',
        text: 'Verify data isolation between tenants',
        required: true,
        response_type: 'evaluator_score'
      },
      {
        id: 'poc-5',
        category: 'data_protection',
        text: 'Test data export and deletion capabilities',
        required: true,
        response_type: 'evaluator_score'
      },
      {
        id: 'poc-6',
        category: 'infrastructure',
        text: 'Review API security (authentication, rate limiting, input validation)',
        required: true,
        response_type: 'evaluator_score'
      },
      {
        id: 'poc-7',
        category: 'infrastructure',
        text: 'Verify audit logging captures required events',
        required: true,
        response_type: 'evaluator_score'
      },
      {
        id: 'poc-8',
        category: 'compliance',
        text: 'Confirm all critical findings from Stage 2 have been addressed',
        required: true,
        response_type: 'evaluator_score'
      }
    ]
  }
};

// Export singleton instance
export const securityAssessmentService = new SecurityAssessmentService();
export default securityAssessmentService;
