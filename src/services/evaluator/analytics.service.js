/**
 * Analytics Service
 *
 * Provides data aggregation and analytics for Evaluator dashboard widgets.
 * Supports score heatmaps, radar charts, timeline progress, and risk indicators.
 *
 * @version 1.0
 * @created January 9, 2026
 * @phase Evaluator Product Roadmap v1.1 - Feature 1.1.3
 */

import { supabase } from '../../lib/supabase';

class AnalyticsService {
  // ============================================================================
  // SCORE HEATMAP
  // ============================================================================

  /**
   * Get score heatmap data (vendors × categories matrix)
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Object>} { vendors, categories, scores[][] }
   */
  async getScoreHeatmap(evaluationProjectId) {
    try {
      // Get vendors
      const { data: vendors } = await supabase
        .from('vendors')
        .select('id, name, status')
        .eq('evaluation_project_id', evaluationProjectId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('name');

      // Get categories with criteria
      const { data: categories } = await supabase
        .from('evaluation_categories')
        .select(`
          id, name, weight,
          criteria:evaluation_criteria(id, name, weight)
        `)
        .eq('evaluation_project_id', evaluationProjectId)
        .order('sort_order', { ascending: true });

      // Get all scores
      const { data: scores } = await supabase
        .from('scores')
        .select('vendor_id, criterion_id, score_value')
        .eq('evaluation_project_id', evaluationProjectId);

      // Get consensus scores
      const { data: consensusScores } = await supabase
        .from('consensus_scores')
        .select('vendor_id, criterion_id, consensus_value');

      // Build score lookup
      const scoreMap = {};
      (scores || []).forEach(s => {
        const key = `${s.vendor_id}:${s.criterion_id}`;
        if (!scoreMap[key]) {
          scoreMap[key] = [];
        }
        scoreMap[key].push(s.score_value);
      });

      // Consensus overrides
      const consensusMap = {};
      (consensusScores || []).forEach(cs => {
        consensusMap[`${cs.vendor_id}:${cs.criterion_id}`] = cs.consensus_value;
      });

      // Build matrix: rows = categories, columns = vendors
      const matrix = (categories || []).map(category => {
        const criteriaIds = (category.criteria || []).map(c => c.id);
        const totalWeight = (category.criteria || []).reduce((sum, c) => sum + (c.weight || 1), 0);

        return (vendors || []).map(vendor => {
          let categoryScore = 0;
          let hasScores = false;

          criteriaIds.forEach(criterionId => {
            const key = `${vendor.id}:${criterionId}`;
            let score = null;

            if (consensusMap[key] !== undefined) {
              score = consensusMap[key];
            } else if (scoreMap[key]?.length > 0) {
              score = scoreMap[key].reduce((a, b) => a + b, 0) / scoreMap[key].length;
            }

            if (score !== null) {
              const criterion = (category.criteria || []).find(c => c.id === criterionId);
              const weight = criterion?.weight || 1;
              categoryScore += (score / 5) * weight; // Normalize to 0-1 and weight
              hasScores = true;
            }
          });

          // Calculate percentage (0-100)
          const percentage = hasScores ? (categoryScore / totalWeight) * 100 : null;

          return {
            vendorId: vendor.id,
            categoryId: category.id,
            score: percentage,
            hasData: hasScores
          };
        });
      });

      return {
        vendors: vendors || [],
        categories: (categories || []).map(c => ({
          id: c.id,
          name: c.name,
          weight: c.weight,
          criteriaCount: c.criteria?.length || 0
        })),
        matrix
      };
    } catch (error) {
      console.error('AnalyticsService.getScoreHeatmap failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // VENDOR RADAR DATA
  // ============================================================================

  /**
   * Get radar chart data for vendor comparison
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @param {Array<string>} vendorIds - Optional list of vendor IDs to include
   * @returns {Promise<Object>} { categories, vendors[] with scores }
   */
  async getVendorRadarData(evaluationProjectId, vendorIds = null) {
    try {
      // Get categories
      const { data: categories } = await supabase
        .from('evaluation_categories')
        .select(`
          id, name, weight,
          criteria:evaluation_criteria(id, weight)
        `)
        .eq('evaluation_project_id', evaluationProjectId)
        .order('sort_order', { ascending: true });

      // Get vendors
      let vendorQuery = supabase
        .from('vendors')
        .select('id, name, status')
        .eq('evaluation_project_id', evaluationProjectId)
        .or('is_deleted.is.null,is_deleted.eq.false');

      if (vendorIds?.length > 0) {
        vendorQuery = vendorQuery.in('id', vendorIds);
      }

      const { data: vendors } = await vendorQuery;

      // Get scores
      const { data: scores } = await supabase
        .from('scores')
        .select('vendor_id, criterion_id, score_value')
        .eq('evaluation_project_id', evaluationProjectId);

      // Get consensus scores
      const { data: consensusScores } = await supabase
        .from('consensus_scores')
        .select('vendor_id, criterion_id, consensus_value');

      // Build maps
      const scoreMap = {};
      (scores || []).forEach(s => {
        const key = `${s.vendor_id}:${s.criterion_id}`;
        if (!scoreMap[key]) scoreMap[key] = [];
        scoreMap[key].push(s.score_value);
      });

      const consensusMap = {};
      (consensusScores || []).forEach(cs => {
        consensusMap[`${cs.vendor_id}:${cs.criterion_id}`] = cs.consensus_value;
      });

      // Calculate category scores for each vendor
      const vendorData = (vendors || []).map(vendor => {
        const categoryScores = (categories || []).map(category => {
          let totalScore = 0;
          let totalWeight = 0;
          let hasScores = false;

          (category.criteria || []).forEach(criterion => {
            const key = `${vendor.id}:${criterion.id}`;
            let score = null;

            if (consensusMap[key] !== undefined) {
              score = consensusMap[key];
            } else if (scoreMap[key]?.length > 0) {
              score = scoreMap[key].reduce((a, b) => a + b, 0) / scoreMap[key].length;
            }

            const weight = criterion.weight || 1;
            if (score !== null) {
              totalScore += score * weight;
              hasScores = true;
            }
            totalWeight += weight * 5; // Max score is 5
          });

          return hasScores ? (totalScore / totalWeight) * 100 : 0;
        });

        return {
          id: vendor.id,
          name: vendor.name,
          status: vendor.status,
          scores: categoryScores
        };
      });

      return {
        categories: (categories || []).map(c => c.name),
        categoryIds: (categories || []).map(c => c.id),
        vendors: vendorData
      };
    } catch (error) {
      console.error('AnalyticsService.getVendorRadarData failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // EVALUATION TIMELINE
  // ============================================================================

  /**
   * Get evaluation timeline progress
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Object>} Timeline phases with completion status
   */
  async getTimelineProgress(evaluationProjectId) {
    try {
      // Get evaluation project
      const { data: evaluation } = await supabase
        .from('evaluation_projects')
        .select('*')
        .eq('id', evaluationProjectId)
        .single();

      if (!evaluation) {
        throw new Error('Evaluation project not found');
      }

      // Get counts for progress calculation
      const [
        { count: requirementsCount },
        { count: approvedRequirements },
        { count: vendorsCount },
        { count: evaluatedVendors },
        { count: workshopsCount },
        { count: completedWorkshops },
        { count: scoresCount }
      ] = await Promise.all([
        supabase.from('requirements').select('id', { count: 'exact' }).eq('evaluation_project_id', evaluationProjectId),
        supabase.from('requirements').select('id', { count: 'exact' }).eq('evaluation_project_id', evaluationProjectId).eq('status', 'approved'),
        supabase.from('vendors').select('id', { count: 'exact' }).eq('evaluation_project_id', evaluationProjectId).or('is_deleted.is.null,is_deleted.eq.false'),
        supabase.from('vendors').select('id', { count: 'exact' }).eq('evaluation_project_id', evaluationProjectId).in('status', ['under_evaluation', 'short_list', 'selected']),
        supabase.from('workshops').select('id', { count: 'exact' }).eq('evaluation_project_id', evaluationProjectId),
        supabase.from('workshops').select('id', { count: 'exact' }).eq('evaluation_project_id', evaluationProjectId).eq('status', 'complete'),
        supabase.from('scores').select('id', { count: 'exact' }).eq('evaluation_project_id', evaluationProjectId)
      ]);

      // Define phases
      const phases = [
        {
          id: 'setup',
          name: 'Setup',
          description: 'Project configuration and team setup',
          status: 'complete', // Always complete if we have the project
          completion: 100
        },
        {
          id: 'discovery',
          name: 'Discovery',
          description: 'Workshops and requirements gathering',
          status: this.getPhaseStatus(evaluation.status, 'discovery', workshopsCount > 0),
          completion: workshopsCount > 0 ? Math.min(100, Math.round((completedWorkshops / workshopsCount) * 100)) : 0,
          metrics: { total: workshopsCount, completed: completedWorkshops }
        },
        {
          id: 'requirements',
          name: 'Requirements',
          description: 'Requirements definition and approval',
          status: this.getPhaseStatus(evaluation.status, 'requirements', approvedRequirements > 0),
          completion: requirementsCount > 0 ? Math.round((approvedRequirements / requirementsCount) * 100) : 0,
          metrics: { total: requirementsCount, approved: approvedRequirements }
        },
        {
          id: 'vendors',
          name: 'Vendors',
          description: 'Vendor identification and shortlisting',
          status: this.getPhaseStatus(evaluation.status, 'vendors', vendorsCount > 0),
          completion: vendorsCount > 0 ? Math.min(100, Math.round((evaluatedVendors / vendorsCount) * 100)) : 0,
          metrics: { total: vendorsCount, inEvaluation: evaluatedVendors }
        },
        {
          id: 'evaluation',
          name: 'Evaluation',
          description: 'Scoring and assessment',
          status: this.getPhaseStatus(evaluation.status, 'evaluation', scoresCount > 0),
          completion: scoresCount > 0 ? Math.min(90, 50 + Math.round(scoresCount / 10)) : 0,
          metrics: { scores: scoresCount }
        },
        {
          id: 'decision',
          name: 'Decision',
          description: 'Final selection and recommendation',
          status: evaluation.status === 'complete' ? 'complete' : 'pending',
          completion: evaluation.status === 'complete' ? 100 : 0
        }
      ];

      // Determine current phase index
      const statusOrder = ['setup', 'discovery', 'requirements', 'evaluation', 'complete'];
      const currentPhaseIndex = Math.max(0, statusOrder.indexOf(evaluation.status));

      return {
        currentPhase: evaluation.status,
        currentPhaseIndex,
        phases,
        startDate: evaluation.created_at,
        targetDate: evaluation.target_decision_date
      };
    } catch (error) {
      console.error('AnalyticsService.getTimelineProgress failed:', error);
      throw error;
    }
  }

  /**
   * Helper to determine phase status
   */
  getPhaseStatus(currentStatus, phaseId, hasData) {
    const order = ['setup', 'discovery', 'requirements', 'vendors', 'evaluation', 'complete'];
    const currentIndex = order.indexOf(currentStatus);
    const phaseIndex = order.indexOf(phaseId);

    if (phaseIndex < currentIndex) return 'complete';
    if (phaseIndex === currentIndex) return 'in_progress';
    if (hasData) return 'started';
    return 'pending';
  }

  // ============================================================================
  // RISK INDICATORS
  // ============================================================================

  /**
   * Get risk indicators for the evaluation
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Object>} Risk indicators
   */
  async getRiskIndicators(evaluationProjectId) {
    try {
      // Get vendors with incomplete responses
      const { data: vendors } = await supabase
        .from('vendors')
        .select(`
          id, name, status,
          responses:vendor_responses(id, status)
        `)
        .eq('evaluation_project_id', evaluationProjectId)
        .or('is_deleted.is.null,is_deleted.eq.false');

      const { data: questions } = await supabase
        .from('vendor_questions')
        .select('id')
        .eq('evaluation_project_id', evaluationProjectId);

      const totalQuestions = questions?.length || 0;

      const incompleteResponses = (vendors || [])
        .filter(v => {
          const submittedResponses = v.responses?.filter(r => r.status === 'submitted').length || 0;
          return submittedResponses < totalQuestions && v.status !== 'rejected' && v.status !== 'withdrawn';
        })
        .map(v => ({
          vendorId: v.id,
          vendorName: v.name,
          submitted: v.responses?.filter(r => r.status === 'submitted').length || 0,
          total: totalQuestions,
          percentage: totalQuestions > 0 ? Math.round((v.responses?.filter(r => r.status === 'submitted').length || 0) / totalQuestions * 100) : 0
        }));

      // Get requirements without scores
      const { data: requirements } = await supabase
        .from('requirements')
        .select('id, title, status')
        .eq('evaluation_project_id', evaluationProjectId)
        .eq('status', 'approved');

      const { data: criteria } = await supabase
        .from('evaluation_criteria')
        .select('id, requirement_id')
        .eq('evaluation_project_id', evaluationProjectId);

      const { data: scores } = await supabase
        .from('scores')
        .select('criterion_id')
        .eq('evaluation_project_id', evaluationProjectId);

      const scoredCriteriaIds = new Set((scores || []).map(s => s.criterion_id));
      const unscoredCriteria = (criteria || []).filter(c => !scoredCriteriaIds.has(c.id));

      // Get high variance scores needing reconciliation
      const { data: allScores } = await supabase
        .from('scores')
        .select(`
          criterion_id, vendor_id, score_value,
          vendor:vendor_id(name),
          criterion:criterion_id(name)
        `)
        .eq('evaluation_project_id', evaluationProjectId)
        .eq('status', 'submitted');

      // Group by vendor+criterion and find high variance
      const scoreGroups = {};
      (allScores || []).forEach(s => {
        const key = `${s.vendor_id}:${s.criterion_id}`;
        if (!scoreGroups[key]) {
          scoreGroups[key] = {
            vendorId: s.vendor_id,
            vendorName: s.vendor?.name,
            criterionId: s.criterion_id,
            criterionName: s.criterion?.name,
            scores: []
          };
        }
        scoreGroups[key].scores.push(s.score_value);
      });

      const varianceIssues = Object.values(scoreGroups)
        .filter(g => {
          if (g.scores.length < 2) return false;
          const variance = Math.max(...g.scores) - Math.min(...g.scores);
          return variance >= 2; // 2+ point difference
        })
        .map(g => ({
          ...g,
          min: Math.min(...g.scores),
          max: Math.max(...g.scores),
          variance: Math.max(...g.scores) - Math.min(...g.scores)
        }));

      // Check for overdue deadlines (placeholder - would need deadline tracking)
      const overdueItems = [];

      // Calculate overall risk level
      const riskScore =
        (incompleteResponses.length > 3 ? 3 : incompleteResponses.length) +
        (unscoredCriteria.length > 10 ? 3 : Math.floor(unscoredCriteria.length / 4)) +
        (varianceIssues.length > 5 ? 3 : Math.floor(varianceIssues.length / 2));

      const riskLevel = riskScore >= 6 ? 'high' : riskScore >= 3 ? 'medium' : 'low';

      return {
        riskLevel,
        riskScore,
        incompleteResponses: {
          count: incompleteResponses.length,
          items: incompleteResponses.slice(0, 5)
        },
        unscoredCriteria: {
          count: unscoredCriteria.length,
          items: unscoredCriteria.slice(0, 5)
        },
        varianceIssues: {
          count: varianceIssues.length,
          items: varianceIssues.slice(0, 5)
        },
        overdueItems: {
          count: overdueItems.length,
          items: overdueItems
        }
      };
    } catch (error) {
      console.error('AnalyticsService.getRiskIndicators failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // STAKEHOLDER PARTICIPATION
  // ============================================================================

  /**
   * Get stakeholder participation metrics
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Object>} Participation by stakeholder area
   */
  async getStakeholderParticipation(evaluationProjectId) {
    try {
      // Get stakeholder areas
      const { data: areas } = await supabase
        .from('stakeholder_areas')
        .select('id, name')
        .eq('evaluation_project_id', evaluationProjectId);

      // Get requirements by stakeholder area
      const { data: requirements } = await supabase
        .from('requirements')
        .select('id, stakeholder_area_id, status')
        .eq('evaluation_project_id', evaluationProjectId);

      // Get workshop attendees (if tracking exists)
      const { data: workshops } = await supabase
        .from('workshops')
        .select(`
          id,
          attendees:workshop_attendees(stakeholder_area_id)
        `)
        .eq('evaluation_project_id', evaluationProjectId);

      // Build participation metrics
      const participation = (areas || []).map(area => {
        const areaRequirements = (requirements || []).filter(r => r.stakeholder_area_id === area.id);
        const approvedRequirements = areaRequirements.filter(r => r.status === 'approved');

        const workshopAttendance = (workshops || []).reduce((count, w) => {
          const areaAttendees = w.attendees?.filter(a => a.stakeholder_area_id === area.id).length || 0;
          return count + (areaAttendees > 0 ? 1 : 0);
        }, 0);

        return {
          id: area.id,
          name: area.name,
          requirementsCount: areaRequirements.length,
          approvedCount: approvedRequirements.length,
          workshopsAttended: workshopAttendance,
          totalWorkshops: workshops?.length || 0,
          participationScore: this.calculateParticipationScore(
            areaRequirements.length,
            approvedRequirements.length,
            workshopAttendance,
            workshops?.length || 0
          )
        };
      });

      // Sort by participation score
      participation.sort((a, b) => b.participationScore - a.participationScore);

      return {
        areas: participation,
        totalAreas: areas?.length || 0,
        averageParticipation: participation.length > 0
          ? Math.round(participation.reduce((sum, a) => sum + a.participationScore, 0) / participation.length)
          : 0
      };
    } catch (error) {
      console.error('AnalyticsService.getStakeholderParticipation failed:', error);
      throw error;
    }
  }

  /**
   * Calculate participation score (0-100)
   */
  calculateParticipationScore(reqCount, approvedCount, workshopAttendance, totalWorkshops) {
    let score = 0;

    // Requirements contribution (0-50 points)
    if (reqCount > 0) {
      score += Math.min(25, reqCount * 5);
      score += Math.min(25, (approvedCount / reqCount) * 25);
    }

    // Workshop attendance (0-50 points)
    if (totalWorkshops > 0) {
      score += Math.min(50, (workshopAttendance / totalWorkshops) * 50);
    }

    return Math.round(score);
  }

  // ============================================================================
  // Q&A ACTIVITY METRICS (v1.1 Feature 1.3)
  // ============================================================================

  /**
   * Get Q&A activity metrics
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Object>} Q&A activity statistics
   */
  async getQAActivityMetrics(evaluationProjectId) {
    try {
      // Get all Q&A entries
      const { data: qaEntries } = await supabase
        .from('vendor_qa')
        .select(`
          id,
          status,
          asked_at,
          answered_at,
          shared_at,
          vendor:vendors!vendor_id(id, name)
        `)
        .eq('evaluation_project_id', evaluationProjectId);

      const entries = qaEntries || [];
      const total = entries.length;
      const pending = entries.filter(q => q.status === 'pending').length;
      const answered = entries.filter(q => q.status === 'answered').length;
      const shared = entries.filter(q => q.status === 'shared').length;

      // Calculate average response time (in hours)
      const answeredWithTime = entries.filter(q => q.asked_at && q.answered_at);
      const avgResponseTimeHours = answeredWithTime.length > 0
        ? answeredWithTime.reduce((sum, q) => {
            const asked = new Date(q.asked_at);
            const answered = new Date(q.answered_at);
            return sum + (answered - asked) / (1000 * 60 * 60);
          }, 0) / answeredWithTime.length
        : 0;

      // Questions by vendor
      const byVendor = {};
      entries.forEach(q => {
        const vendorName = q.vendor?.name || 'Unknown';
        if (!byVendor[vendorName]) {
          byVendor[vendorName] = { total: 0, pending: 0, answered: 0 };
        }
        byVendor[vendorName].total++;
        if (q.status === 'pending') byVendor[vendorName].pending++;
        if (q.status === 'answered' || q.status === 'shared') byVendor[vendorName].answered++;
      });

      // Questions over time (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentQuestions = entries.filter(q =>
        q.asked_at && new Date(q.asked_at) >= thirtyDaysAgo
      );

      // Group by day
      const questionsByDay = {};
      recentQuestions.forEach(q => {
        const day = new Date(q.asked_at).toISOString().split('T')[0];
        questionsByDay[day] = (questionsByDay[day] || 0) + 1;
      });

      return {
        total,
        pending,
        answered,
        shared,
        responseRate: total > 0 ? Math.round(((answered + shared) / total) * 100) : 0,
        avgResponseTimeHours: Math.round(avgResponseTimeHours * 10) / 10,
        byVendor: Object.entries(byVendor).map(([name, stats]) => ({ name, ...stats })),
        trend: Object.entries(questionsByDay)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date))
      };
    } catch (error) {
      console.error('AnalyticsService.getQAActivityMetrics failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // CLIENT APPROVAL PROGRESS (v1.1 Feature 1.3)
  // ============================================================================

  /**
   * Get client approval progress metrics
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Object>} Client approval statistics
   */
  async getClientApprovalProgress(evaluationProjectId) {
    try {
      // Get requirements with approval status
      const { data: requirements } = await supabase
        .from('requirements')
        .select(`
          id,
          title,
          status,
          priority,
          stakeholder_area:stakeholder_areas!stakeholder_area_id(id, name, color),
          requirement_approvals(id, status, client_name, approved_at, stakeholder_area_id)
        `)
        .eq('evaluation_project_id', evaluationProjectId)
        .or('is_deleted.is.null,is_deleted.eq.false');

      const reqs = requirements || [];
      const total = reqs.length;

      // Count by approval status
      let clientApproved = 0;
      let clientPending = 0;
      let changesRequested = 0;
      let noReview = 0;

      reqs.forEach(req => {
        const approvals = req.requirement_approvals || [];
        if (approvals.length === 0) {
          noReview++;
        } else {
          // Get latest status
          const latestApproval = approvals[0];
          switch (latestApproval.status) {
            case 'approved':
              clientApproved++;
              break;
            case 'changes_requested':
              changesRequested++;
              break;
            default:
              clientPending++;
          }
        }
      });

      // Get stakeholder area approvals (final sign-offs)
      const { data: areaApprovals } = await supabase
        .from('stakeholder_area_approvals')
        .select(`
          id,
          stakeholder_area:stakeholder_areas!stakeholder_area_id(id, name, color),
          approved_by_name,
          approved_at,
          total_requirements,
          approved_count
        `)
        .eq('evaluation_project_id', evaluationProjectId);

      // Get stakeholder areas
      const { data: areas } = await supabase
        .from('stakeholder_areas')
        .select('id, name, color')
        .eq('evaluation_project_id', evaluationProjectId)
        .or('is_deleted.is.null,is_deleted.eq.false');

      // Calculate approval by area
      const byArea = (areas || []).map(area => {
        const areaReqs = reqs.filter(r => r.stakeholder_area?.id === area.id);
        const areaApproved = areaReqs.filter(r => {
          const approvals = r.requirement_approvals || [];
          return approvals.some(a => a.status === 'approved');
        }).length;
        const finalApproval = (areaApprovals || []).find(a => a.stakeholder_area?.id === area.id);

        return {
          id: area.id,
          name: area.name,
          color: area.color,
          total: areaReqs.length,
          approved: areaApproved,
          percentage: areaReqs.length > 0 ? Math.round((areaApproved / areaReqs.length) * 100) : 0,
          hasFinalApproval: !!finalApproval,
          finalApprovalDate: finalApproval?.approved_at,
          finalApprovalBy: finalApproval?.approved_by_name
        };
      });

      return {
        total,
        clientApproved,
        clientPending,
        changesRequested,
        noReview,
        overallProgress: total > 0 ? Math.round((clientApproved / total) * 100) : 0,
        reviewProgress: total > 0 ? Math.round(((clientApproved + changesRequested) / total) * 100) : 0,
        byArea,
        areasWithFinalApproval: byArea.filter(a => a.hasFinalApproval).length,
        totalAreas: byArea.length
      };
    } catch (error) {
      console.error('AnalyticsService.getClientApprovalProgress failed:', error);
      throw error;
    }
  }

  // ============================================================================
  // SECURITY ASSESSMENT STATUS (v1.1 Feature 1.3)
  // ============================================================================

  /**
   * Get security assessment status across all vendors
   * @param {string} evaluationProjectId - Evaluation Project UUID
   * @returns {Promise<Object>} Security assessment statistics
   */
  async getSecurityAssessmentStatus(evaluationProjectId) {
    try {
      // Get vendors
      const { data: vendors } = await supabase
        .from('vendors')
        .select('id, name, status')
        .eq('evaluation_project_id', evaluationProjectId)
        .or('is_deleted.is.null,is_deleted.eq.false');

      // Get security assessments
      const { data: assessments } = await supabase
        .from('security_assessments')
        .select(`
          id,
          vendor_id,
          stage,
          status,
          overall_score,
          risk_level,
          submitted_at,
          reviewed_at
        `)
        .eq('evaluation_project_id', evaluationProjectId);

      // Get security findings
      const { data: findings } = await supabase
        .from('security_findings')
        .select(`
          id,
          vendor_id,
          severity,
          status,
          category
        `)
        .eq('evaluation_project_id', evaluationProjectId);

      const vendorList = vendors || [];
      const assessmentList = assessments || [];
      const findingList = findings || [];

      // Stage completion by vendor
      const stages = ['rfp', 'technical_review', 'poc'];
      const vendorStatus = vendorList.map(vendor => {
        const vendorAssessments = assessmentList.filter(a => a.vendor_id === vendor.id);
        const vendorFindings = findingList.filter(f => f.vendor_id === vendor.id);

        const stageStatus = {};
        stages.forEach(stage => {
          const assessment = vendorAssessments.find(a => a.stage === stage);
          stageStatus[stage] = assessment ? {
            status: assessment.status,
            score: assessment.overall_score,
            riskLevel: assessment.risk_level
          } : null;
        });

        const openFindings = vendorFindings.filter(f => f.status === 'open' || f.status === 'in_progress');
        const criticalFindings = openFindings.filter(f => f.severity === 'critical');

        return {
          vendorId: vendor.id,
          vendorName: vendor.name,
          stages: stageStatus,
          completedStages: stages.filter(s => stageStatus[s]?.status === 'complete').length,
          openFindings: openFindings.length,
          criticalFindings: criticalFindings.length,
          overallRisk: this.calculateOverallSecurityRisk(stageStatus, openFindings)
        };
      });

      // Aggregate stats
      const totalAssessments = assessmentList.length;
      const completedAssessments = assessmentList.filter(a => a.status === 'complete').length;

      const findingsBySeverity = {
        critical: findingList.filter(f => f.severity === 'critical').length,
        high: findingList.filter(f => f.severity === 'high').length,
        medium: findingList.filter(f => f.severity === 'medium').length,
        low: findingList.filter(f => f.severity === 'low').length
      };

      const openFindings = findingList.filter(f => f.status === 'open' || f.status === 'in_progress').length;
      const resolvedFindings = findingList.filter(f => f.status === 'resolved').length;

      return {
        vendorCount: vendorList.length,
        totalAssessments,
        completedAssessments,
        assessmentProgress: totalAssessments > 0 ? Math.round((completedAssessments / totalAssessments) * 100) : 0,
        totalFindings: findingList.length,
        openFindings,
        resolvedFindings,
        findingsBySeverity,
        vendorStatus: vendorStatus.sort((a, b) => b.criticalFindings - a.criticalFindings),
        vendorsWithCritical: vendorStatus.filter(v => v.criticalFindings > 0).length,
        vendorsCleared: vendorStatus.filter(v => v.completedStages === 3 && v.openFindings === 0).length
      };
    } catch (error) {
      console.error('AnalyticsService.getSecurityAssessmentStatus failed:', error);
      throw error;
    }
  }

  /**
   * Calculate overall security risk for a vendor
   */
  calculateOverallSecurityRisk(stageStatus, openFindings) {
    const criticalCount = openFindings.filter(f => f.severity === 'critical').length;
    const highCount = openFindings.filter(f => f.severity === 'high').length;

    if (criticalCount > 0) return 'critical';
    if (highCount >= 3) return 'high';
    if (highCount > 0 || openFindings.length >= 5) return 'medium';
    return 'low';
  }
}

// Export singleton instance
export const analyticsService = new AnalyticsService();
export default analyticsService;
