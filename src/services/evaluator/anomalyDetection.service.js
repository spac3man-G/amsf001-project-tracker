/**
 * AnomalyDetectionService
 * Part of: Evaluator Product Roadmap v1.0.x - Feature 0.3: Anomaly Detection & Risk Flagging
 *
 * Automatically detects statistical outliers in vendor bids and responses
 * including price, schedule, compliance, and scope anomalies.
 */

import { supabase } from '../../lib/supabase';

// Anomaly types
export const ANOMALY_TYPES = {
  PRICE: 'price',
  SCHEDULE: 'schedule',
  COMPLIANCE: 'compliance',
  SCOPE: 'scope',
  FEATURE: 'feature',
  RESOURCE: 'resource',
  EXPERIENCE: 'experience',
  SLA: 'sla',
};

// Anomaly severities
export const ANOMALY_SEVERITIES = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
};

// Anomaly statuses
export const ANOMALY_STATUSES = {
  OPEN: 'open',
  UNDER_REVIEW: 'under_review',
  CLARIFICATION_SENT: 'clarification_sent',
  RESOLVED: 'resolved',
  ACCEPTED: 'accepted',
  DISMISSED: 'dismissed',
};

// Action types
export const ACTION_TYPES = {
  REQUEST_CLARIFICATION: 'request_clarification',
  REQUEST_BREAKDOWN: 'request_breakdown',
  VERIFY_SCOPE: 'verify_scope',
  CHECK_CERTIFICATION: 'check_certification',
  REVIEW_TIMELINE: 'review_timeline',
  COMPARE_SOW: 'compare_sow',
  ESCALATE: 'escalate',
};

// Pricing types
export const PRICING_TYPES = {
  TOTAL_CONTRACT: 'total_contract',
  LICENSE_YEAR_1: 'license_year_1',
  LICENSE_ANNUAL: 'license_annual',
  IMPLEMENTATION: 'implementation',
  DATA_MIGRATION: 'data_migration',
  TRAINING: 'training',
  SUPPORT_ANNUAL: 'support_annual',
  CUSTOMIZATION: 'customization',
  INTEGRATION: 'integration',
  CONTINGENCY: 'contingency',
  THREE_YEAR_TCO: 'three_year_tco',
  FIVE_YEAR_TCO: 'five_year_tco',
  PER_USER_MONTHLY: 'per_user_monthly',
  PER_TRANSACTION: 'per_transaction',
};

// Timeline milestone types
export const MILESTONE_TYPES = {
  TOTAL_IMPLEMENTATION: 'total_implementation',
  PHASE_1: 'phase_1',
  PHASE_2: 'phase_2',
  PHASE_3: 'phase_3',
  DATA_MIGRATION: 'data_migration',
  TESTING: 'testing',
  TRAINING: 'training',
  GO_LIVE: 'go_live',
  STABILIZATION: 'stabilization',
  FULL_ROLLOUT: 'full_rollout',
};

class AnomalyDetectionService {
  // ============================================================================
  // ANOMALY CRUD OPERATIONS
  // ============================================================================

  /**
   * Get all anomalies for a project
   */
  async getAnomalies(evaluationProjectId, options = {}) {
    const {
      vendorId,
      type,
      severity,
      status,
      includeResolved = false,
    } = options;

    let query = supabase
      .from('vendor_response_anomalies')
      .select(`
        *,
        vendors(id, name),
        requirements(id, title),
        evaluation_categories(id, name),
        resolved_by_profile:profiles!resolved_by(id, full_name)
      `)
      .eq('evaluation_project_id', evaluationProjectId)
      .order('severity', { ascending: false })
      .order('detected_at', { ascending: false });

    if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    }

    if (type) {
      query = query.eq('anomaly_type', type);
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (status) {
      query = query.eq('status', status);
    } else if (!includeResolved) {
      query = query.in('status', ['open', 'under_review', 'clarification_sent']);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Get anomaly by ID
   */
  async getAnomalyById(anomalyId) {
    const { data, error } = await supabase
      .from('vendor_response_anomalies')
      .select(`
        *,
        vendors(id, name),
        requirements(id, title),
        evaluation_categories(id, name),
        resolved_by_profile:profiles!resolved_by(id, full_name)
      `)
      .eq('id', anomalyId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create a manual anomaly
   */
  async createAnomaly(anomalyData) {
    const { data, error } = await supabase
      .from('vendor_response_anomalies')
      .insert({
        ...anomalyData,
        detected_by: 'manual',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update anomaly status
   */
  async updateAnomalyStatus(anomalyId, status, userId, resolutionNote = null) {
    const updateData = { status };

    if (['resolved', 'accepted', 'dismissed'].includes(status)) {
      updateData.resolved_by = userId;
      updateData.resolved_at = new Date().toISOString();
      if (resolutionNote) {
        updateData.resolution_note = resolutionNote;
      }
    }

    const { data, error } = await supabase
      .from('vendor_response_anomalies')
      .update(updateData)
      .eq('id', anomalyId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Resolve an anomaly
   */
  async resolveAnomaly(anomalyId, userId, resolutionNote) {
    return this.updateAnomalyStatus(anomalyId, ANOMALY_STATUSES.RESOLVED, userId, resolutionNote);
  }

  /**
   * Accept an anomaly (acknowledged but not a problem)
   */
  async acceptAnomaly(anomalyId, userId, acceptanceNote) {
    return this.updateAnomalyStatus(anomalyId, ANOMALY_STATUSES.ACCEPTED, userId, acceptanceNote);
  }

  /**
   * Dismiss an anomaly (false positive)
   */
  async dismissAnomaly(anomalyId, userId, dismissalReason) {
    return this.updateAnomalyStatus(anomalyId, ANOMALY_STATUSES.DISMISSED, userId, dismissalReason);
  }

  /**
   * Mark anomaly as under review
   */
  async markUnderReview(anomalyId) {
    return this.updateAnomalyStatus(anomalyId, ANOMALY_STATUSES.UNDER_REVIEW);
  }

  /**
   * Mark clarification sent
   */
  async markClarificationSent(anomalyId) {
    return this.updateAnomalyStatus(anomalyId, ANOMALY_STATUSES.CLARIFICATION_SENT);
  }

  /**
   * Reopen a resolved anomaly
   */
  async reopenAnomaly(anomalyId) {
    const { data, error } = await supabase
      .from('vendor_response_anomalies')
      .update({
        status: ANOMALY_STATUSES.OPEN,
        resolved_by: null,
        resolved_at: null,
        resolution_note: null,
      })
      .eq('id', anomalyId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete an anomaly
   */
  async deleteAnomaly(anomalyId) {
    const { error } = await supabase
      .from('vendor_response_anomalies')
      .delete()
      .eq('id', anomalyId);

    if (error) throw error;
    return true;
  }

  // ============================================================================
  // THRESHOLD MANAGEMENT
  // ============================================================================

  /**
   * Get thresholds for a project
   */
  async getThresholds(evaluationProjectId) {
    const { data, error } = await supabase
      .from('anomaly_thresholds')
      .select('*')
      .eq('evaluation_project_id', evaluationProjectId)
      .order('anomaly_type');

    if (error) throw error;
    return data || [];
  }

  /**
   * Update a threshold
   */
  async updateThreshold(thresholdId, updates) {
    const { data, error } = await supabase
      .from('anomaly_thresholds')
      .update(updates)
      .eq('id', thresholdId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Initialize default thresholds for a project
   */
  async initializeThresholds(evaluationProjectId) {
    const { error } = await supabase.rpc('create_default_anomaly_thresholds', {
      project_id: evaluationProjectId,
    });

    if (error) throw error;
    return this.getThresholds(evaluationProjectId);
  }

  // ============================================================================
  // PRICING DATA MANAGEMENT
  // ============================================================================

  /**
   * Get pricing data for a project
   */
  async getPricingData(evaluationProjectId, vendorId = null) {
    let query = supabase
      .from('vendor_pricing_data')
      .select(`
        *,
        vendors(id, name)
      `)
      .eq('evaluation_project_id', evaluationProjectId)
      .order('pricing_type');

    if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Save pricing data for a vendor
   */
  async savePricingData(evaluationProjectId, vendorId, pricingType, amount, currency = 'GBP', notes = null) {
    const { data, error } = await supabase
      .from('vendor_pricing_data')
      .upsert({
        evaluation_project_id: evaluationProjectId,
        vendor_id: vendorId,
        pricing_type: pricingType,
        amount,
        currency,
        notes,
      }, {
        onConflict: 'evaluation_project_id,vendor_id,pricing_type',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Bulk save pricing data for a vendor
   */
  async bulkSavePricingData(evaluationProjectId, vendorId, pricingItems) {
    const records = pricingItems.map(item => ({
      evaluation_project_id: evaluationProjectId,
      vendor_id: vendorId,
      pricing_type: item.type,
      amount: item.amount,
      currency: item.currency || 'GBP',
      notes: item.notes || null,
    }));

    const { data, error } = await supabase
      .from('vendor_pricing_data')
      .upsert(records, {
        onConflict: 'evaluation_project_id,vendor_id,pricing_type',
      })
      .select();

    if (error) throw error;
    return data;
  }

  // ============================================================================
  // TIMELINE DATA MANAGEMENT
  // ============================================================================

  /**
   * Get timeline data for a project
   */
  async getTimelineData(evaluationProjectId, vendorId = null) {
    let query = supabase
      .from('vendor_timeline_data')
      .select(`
        *,
        vendors(id, name)
      `)
      .eq('evaluation_project_id', evaluationProjectId)
      .order('milestone_type');

    if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Save timeline data for a vendor
   */
  async saveTimelineData(evaluationProjectId, vendorId, milestoneType, durationDays, notes = null, assumptions = null) {
    const { data, error } = await supabase
      .from('vendor_timeline_data')
      .upsert({
        evaluation_project_id: evaluationProjectId,
        vendor_id: vendorId,
        milestone_type: milestoneType,
        duration_days: durationDays,
        notes,
        assumptions,
      }, {
        onConflict: 'evaluation_project_id,vendor_id,milestone_type',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Bulk save timeline data for a vendor
   */
  async bulkSaveTimelineData(evaluationProjectId, vendorId, timelineItems) {
    const records = timelineItems.map(item => ({
      evaluation_project_id: evaluationProjectId,
      vendor_id: vendorId,
      milestone_type: item.type,
      duration_days: item.durationDays,
      notes: item.notes || null,
      assumptions: item.assumptions || null,
    }));

    const { data, error } = await supabase
      .from('vendor_timeline_data')
      .upsert(records, {
        onConflict: 'evaluation_project_id,vendor_id,milestone_type',
      })
      .select();

    if (error) throw error;
    return data;
  }

  // ============================================================================
  // ANOMALY DETECTION ENGINE
  // ============================================================================

  /**
   * Run full anomaly detection for a project
   */
  async runAnomalyDetection(evaluationProjectId) {
    const results = {
      priceAnomalies: [],
      scheduleAnomalies: [],
      totalDetected: 0,
    };

    // Get thresholds
    let thresholds = await this.getThresholds(evaluationProjectId);
    if (thresholds.length === 0) {
      thresholds = await this.initializeThresholds(evaluationProjectId);
    }

    const thresholdMap = {};
    thresholds.forEach(t => {
      thresholdMap[t.anomaly_type] = t;
    });

    // Detect price anomalies
    if (thresholdMap.price?.enabled) {
      const priceAnomalies = await this.detectPriceAnomalies(
        evaluationProjectId,
        thresholdMap.price.warning_threshold,
        thresholdMap.price.critical_threshold,
        thresholdMap.price.min_vendors_required
      );
      results.priceAnomalies = priceAnomalies;
      results.totalDetected += priceAnomalies.length;
    }

    // Detect schedule anomalies
    if (thresholdMap.schedule?.enabled) {
      const scheduleAnomalies = await this.detectScheduleAnomalies(
        evaluationProjectId,
        thresholdMap.schedule.warning_threshold,
        thresholdMap.schedule.critical_threshold,
        thresholdMap.schedule.min_vendors_required
      );
      results.scheduleAnomalies = scheduleAnomalies;
      results.totalDetected += scheduleAnomalies.length;
    }

    return results;
  }

  /**
   * Detect price anomalies
   */
  async detectPriceAnomalies(evaluationProjectId, warningThreshold, criticalThreshold, minVendors = 2) {
    const pricingData = await this.getPricingData(evaluationProjectId);
    const anomalies = [];

    // Group by pricing type
    const byType = {};
    pricingData.forEach(p => {
      if (!byType[p.pricing_type]) {
        byType[p.pricing_type] = [];
      }
      byType[p.pricing_type].push(p);
    });

    // Analyze each pricing type
    for (const [pricingType, items] of Object.entries(byType)) {
      if (items.length < minVendors) continue;

      const amounts = items.map(i => i.amount);
      const stats = this.calculateStats(amounts);

      for (const item of items) {
        const deviation = this.calculateDeviation(item.amount, stats.median);

        if (Math.abs(deviation) >= criticalThreshold || Math.abs(deviation) >= warningThreshold) {
          const severity = Math.abs(deviation) >= criticalThreshold
            ? ANOMALY_SEVERITIES.CRITICAL
            : ANOMALY_SEVERITIES.WARNING;

          const isLower = deviation < 0;
          const anomaly = {
            evaluation_project_id: evaluationProjectId,
            vendor_id: item.vendor_id,
            anomaly_type: ANOMALY_TYPES.PRICE,
            severity,
            title: `${isLower ? 'Unusually Low' : 'Unusually High'} ${this.formatPricingType(pricingType)}`,
            description: `${item.vendors?.name || 'Vendor'}'s ${this.formatPricingType(pricingType)} of ${this.formatCurrency(item.amount, item.currency)} is ${Math.abs(deviation).toFixed(1)}% ${isLower ? 'below' : 'above'} the median (${this.formatCurrency(stats.median, item.currency)}). ${isLower ? 'This may indicate missing scope or unrealistic estimates.' : 'This may indicate premium services or inflated pricing.'}`,
            detected_value: this.formatCurrency(item.amount, item.currency),
            comparison_values: items.filter(i => i.vendor_id !== item.vendor_id).map(i => ({
              vendorId: i.vendor_id,
              vendorName: i.vendors?.name,
              value: this.formatCurrency(i.amount, i.currency),
            })),
            typical_range: `${this.formatCurrency(stats.min, item.currency)} - ${this.formatCurrency(stats.max, item.currency)}`,
            deviation_percentage: deviation,
            statistical_method: 'median',
            recommended_action: isLower
              ? 'Request detailed breakdown and verify scope inclusion'
              : 'Review pricing structure and compare deliverables',
            action_type: isLower ? ACTION_TYPES.REQUEST_BREAKDOWN : ACTION_TYPES.COMPARE_SOW,
            detected_by: 'system',
            detection_confidence: this.calculateConfidence(items.length, Math.abs(deviation)),
          };

          // Check if this anomaly already exists
          const existing = await this.findExistingAnomaly(
            evaluationProjectId,
            item.vendor_id,
            ANOMALY_TYPES.PRICE,
            pricingType
          );

          if (!existing) {
            const { data, error } = await supabase
              .from('vendor_response_anomalies')
              .insert(anomaly)
              .select()
              .single();

            if (!error) {
              anomalies.push(data);
            }
          }
        }
      }
    }

    return anomalies;
  }

  /**
   * Detect schedule anomalies
   */
  async detectScheduleAnomalies(evaluationProjectId, warningThreshold, criticalThreshold, minVendors = 2) {
    const timelineData = await this.getTimelineData(evaluationProjectId);
    const anomalies = [];

    // Group by milestone type
    const byType = {};
    timelineData.forEach(t => {
      if (!byType[t.milestone_type]) {
        byType[t.milestone_type] = [];
      }
      byType[t.milestone_type].push(t);
    });

    // Analyze each milestone type
    for (const [milestoneType, items] of Object.entries(byType)) {
      if (items.length < minVendors) continue;

      const durations = items.map(i => i.duration_days);
      const stats = this.calculateStats(durations);

      for (const item of items) {
        const deviation = this.calculateDeviation(item.duration_days, stats.median);

        if (Math.abs(deviation) >= criticalThreshold || Math.abs(deviation) >= warningThreshold) {
          const severity = Math.abs(deviation) >= criticalThreshold
            ? ANOMALY_SEVERITIES.CRITICAL
            : ANOMALY_SEVERITIES.WARNING;

          const isFaster = deviation < 0;
          const anomaly = {
            evaluation_project_id: evaluationProjectId,
            vendor_id: item.vendor_id,
            anomaly_type: ANOMALY_TYPES.SCHEDULE,
            severity,
            title: `${isFaster ? 'Unusually Fast' : 'Unusually Slow'} ${this.formatMilestoneType(milestoneType)}`,
            description: `${item.vendors?.name || 'Vendor'}'s ${this.formatMilestoneType(milestoneType)} estimate of ${this.formatDuration(item.duration_days)} is ${Math.abs(deviation).toFixed(1)}% ${isFaster ? 'faster' : 'slower'} than the median (${this.formatDuration(stats.median)}). ${isFaster ? 'This may indicate an overly optimistic timeline or reduced scope.' : 'This may indicate a more thorough approach or resource constraints.'}`,
            detected_value: this.formatDuration(item.duration_days),
            comparison_values: items.filter(i => i.vendor_id !== item.vendor_id).map(i => ({
              vendorId: i.vendor_id,
              vendorName: i.vendors?.name,
              value: this.formatDuration(i.duration_days),
            })),
            typical_range: `${this.formatDuration(stats.min)} - ${this.formatDuration(stats.max)}`,
            deviation_percentage: deviation,
            statistical_method: 'median',
            recommended_action: isFaster
              ? 'Review implementation plan and verify all phases included'
              : 'Understand timeline drivers and resource allocation',
            action_type: ACTION_TYPES.REVIEW_TIMELINE,
            detected_by: 'system',
            detection_confidence: this.calculateConfidence(items.length, Math.abs(deviation)),
          };

          // Check if this anomaly already exists
          const existing = await this.findExistingAnomaly(
            evaluationProjectId,
            item.vendor_id,
            ANOMALY_TYPES.SCHEDULE,
            milestoneType
          );

          if (!existing) {
            const { data, error } = await supabase
              .from('vendor_response_anomalies')
              .insert(anomaly)
              .select()
              .single();

            if (!error) {
              anomalies.push(data);
            }
          }
        }
      }
    }

    return anomalies;
  }

  /**
   * Find existing anomaly to avoid duplicates
   */
  async findExistingAnomaly(evaluationProjectId, vendorId, anomalyType, subType) {
    const { data } = await supabase
      .from('vendor_response_anomalies')
      .select('id')
      .eq('evaluation_project_id', evaluationProjectId)
      .eq('vendor_id', vendorId)
      .eq('anomaly_type', anomalyType)
      .ilike('title', `%${subType}%`)
      .in('status', ['open', 'under_review', 'clarification_sent'])
      .limit(1);

    return data?.[0] || null;
  }

  // ============================================================================
  // STATISTICS HELPERS
  // ============================================================================

  /**
   * Calculate basic statistics
   */
  calculateStats(values) {
    if (!values || values.length === 0) {
      return { min: 0, max: 0, mean: 0, median: 0, stdDev: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;

    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(variance);

    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean,
      median,
      stdDev,
    };
  }

  /**
   * Calculate percentage deviation from a reference value
   */
  calculateDeviation(value, reference) {
    if (reference === 0) return 0;
    return ((value - reference) / reference) * 100;
  }

  /**
   * Calculate confidence score based on sample size and deviation
   */
  calculateConfidence(sampleSize, deviation) {
    // Higher sample size = higher confidence
    const sizeConfidence = Math.min(sampleSize / 5, 1);
    // Higher deviation = higher confidence (clearer signal)
    const deviationConfidence = Math.min(deviation / 50, 1);
    return Math.round((sizeConfidence * 0.4 + deviationConfidence * 0.6) * 100) / 100;
  }

  // ============================================================================
  // FORMATTING HELPERS
  // ============================================================================

  formatCurrency(amount, currency = 'GBP') {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatDuration(days) {
    if (days < 5) return `${days} days`;
    if (days < 22) return `${Math.round(days / 5)} weeks`;
    return `${Math.round(days / 22)} months`;
  }

  formatPricingType(type) {
    const labels = {
      total_contract: 'Total Contract Value',
      license_year_1: 'Year 1 License Cost',
      license_annual: 'Annual License Cost',
      implementation: 'Implementation Cost',
      data_migration: 'Data Migration Cost',
      training: 'Training Cost',
      support_annual: 'Annual Support Cost',
      customization: 'Customization Cost',
      integration: 'Integration Cost',
      contingency: 'Contingency Budget',
      three_year_tco: '3-Year TCO',
      five_year_tco: '5-Year TCO',
      per_user_monthly: 'Per User Monthly Cost',
      per_transaction: 'Per Transaction Cost',
    };
    return labels[type] || type;
  }

  formatMilestoneType(type) {
    const labels = {
      total_implementation: 'Total Implementation',
      phase_1: 'Phase 1',
      phase_2: 'Phase 2',
      phase_3: 'Phase 3',
      data_migration: 'Data Migration',
      testing: 'Testing Phase',
      training: 'Training',
      go_live: 'Go-Live',
      stabilization: 'Stabilization',
      full_rollout: 'Full Rollout',
    };
    return labels[type] || type;
  }

  // ============================================================================
  // STATISTICS AND REPORTING
  // ============================================================================

  /**
   * Get anomaly statistics for a project
   */
  async getAnomalyStats(evaluationProjectId) {
    const anomalies = await this.getAnomalies(evaluationProjectId, { includeResolved: true });

    const stats = {
      total: anomalies.length,
      open: 0,
      underReview: 0,
      clarificationSent: 0,
      resolved: 0,
      accepted: 0,
      dismissed: 0,
      byType: {},
      bySeverity: {
        critical: 0,
        warning: 0,
        info: 0,
      },
      byVendor: {},
    };

    anomalies.forEach(a => {
      // By status
      switch (a.status) {
        case 'open': stats.open++; break;
        case 'under_review': stats.underReview++; break;
        case 'clarification_sent': stats.clarificationSent++; break;
        case 'resolved': stats.resolved++; break;
        case 'accepted': stats.accepted++; break;
        case 'dismissed': stats.dismissed++; break;
      }

      // By type
      stats.byType[a.anomaly_type] = (stats.byType[a.anomaly_type] || 0) + 1;

      // By severity
      stats.bySeverity[a.severity]++;

      // By vendor
      const vendorName = a.vendors?.name || 'Unknown';
      if (!stats.byVendor[vendorName]) {
        stats.byVendor[vendorName] = { total: 0, open: 0, critical: 0 };
      }
      stats.byVendor[vendorName].total++;
      if (['open', 'under_review', 'clarification_sent'].includes(a.status)) {
        stats.byVendor[vendorName].open++;
      }
      if (a.severity === 'critical') {
        stats.byVendor[vendorName].critical++;
      }
    });

    return stats;
  }

  /**
   * Get vendor comparison data for charts
   */
  async getVendorComparisonData(evaluationProjectId) {
    const pricingData = await this.getPricingData(evaluationProjectId);
    const timelineData = await this.getTimelineData(evaluationProjectId);

    // Organize by vendor
    const vendors = {};

    pricingData.forEach(p => {
      const vendorName = p.vendors?.name || p.vendor_id;
      if (!vendors[vendorName]) {
        vendors[vendorName] = { pricing: {}, timeline: {} };
      }
      vendors[vendorName].pricing[p.pricing_type] = p.amount;
    });

    timelineData.forEach(t => {
      const vendorName = t.vendors?.name || t.vendor_id;
      if (!vendors[vendorName]) {
        vendors[vendorName] = { pricing: {}, timeline: {} };
      }
      vendors[vendorName].timeline[t.milestone_type] = t.duration_days;
    });

    return vendors;
  }
}

export const anomalyDetectionService = new AnomalyDetectionService();
export default anomalyDetectionService;
