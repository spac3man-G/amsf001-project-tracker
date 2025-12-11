/**
 * KPIs Service
 * 
 * Handles all KPI-related data operations.
 * Updated to use centralized metrics configuration for status filtering.
 * 
 * @version 2.0
 * @updated 3 December 2025
 * @phase Centralized Metrics
 */

import { BaseService } from './base.service';
import { supabase } from '../lib/supabase';
import { VALID_STATUSES } from '../config/metricsConfig';

export class KPIsService extends BaseService {
  constructor() {
    super('kpis');
  }

  /**
   * Get all KPIs with RAG status calculated
   */
  async getAllWithStatus(projectId) {
    try {
      const kpis = await this.getAll(projectId, {
        orderBy: { column: 'name', ascending: true }
      });

      return kpis.map(kpi => ({
        ...kpi,
        rag_status: this.calculateRAG(kpi)
      }));
    } catch (error) {
      console.error('KPIsService getAllWithStatus error:', error);
      throw error;
    }
  }

  /**
   * Calculate RAG status for a KPI
   */
  calculateRAG(kpi) {
    // Database columns are 'target' and 'current_value'
    if (!kpi.target || kpi.current_value === null || kpi.current_value === undefined) {
      return 'Unknown';
    }

    const actual = parseFloat(kpi.current_value);
    const target = parseFloat(kpi.target);
    const threshold = parseFloat(kpi.threshold_amber || 10);

    if (kpi.trend === 'higher_better') {
      if (actual >= target) return 'Green';
      if (actual >= target * (1 - threshold / 100)) return 'Amber';
      return 'Red';
    } else {
      if (actual <= target) return 'Green';
      if (actual <= target * (1 + threshold / 100)) return 'Amber';
      return 'Red';
    }
  }

  /**
   * Get KPIs by RAG status
   */
  async getByRAGStatus(projectId, ragStatus) {
    try {
      const kpis = await this.getAllWithStatus(projectId);
      return kpis.filter(kpi => kpi.rag_status === ragStatus);
    } catch (error) {
      console.error('KPIsService getByRAGStatus error:', error);
      throw error;
    }
  }

  /**
   * Get KPIs that need attention (Amber or Red)
   */
  async getNeedingAttention(projectId) {
    try {
      const kpis = await this.getAllWithStatus(projectId);
      return kpis.filter(kpi => kpi.rag_status === 'Amber' || kpi.rag_status === 'Red');
    } catch (error) {
      console.error('KPIsService getNeedingAttention error:', error);
      throw error;
    }
  }

  /**
   * Update KPI actual value
   */
  async updateActualValue(kpiId, actualValue) {
    return this.update(kpiId, {
      actual_value: actualValue,
      last_updated: new Date().toISOString()
    });
  }

  /**
   * Get KPI history (if tracking historical values)
   */
  async getHistory(kpiId, limit = 12) {
    try {
      const { data, error } = await supabase
        .from('kpi_history')
        .select('*')
        .eq('kpi_id', kpiId)
        .order('recorded_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      // Table might not exist, return empty
      console.warn('KPI history not available:', error.message);
      return [];
    }
  }

  /**
   * Get summary statistics
   */
  async getSummary(projectId) {
    try {
      const kpis = await this.getAllWithStatus(projectId);
      
      return {
        total: kpis.length,
        green: kpis.filter(k => k.rag_status === 'Green').length,
        amber: kpis.filter(k => k.rag_status === 'Amber').length,
        red: kpis.filter(k => k.rag_status === 'Red').length,
        unknown: kpis.filter(k => k.rag_status === 'Unknown').length
      };
    } catch (error) {
      console.error('KPIsService getSummary error:', error);
      throw error;
    }
  }

  /**
   * Get KPI assessments from deliverable_kpi_assessments table
   * ONLY includes assessments from NON-DELETED deliverables with valid status
   * 
   * Uses centralized VALID_STATUSES config for consistency across the app.
   */
  async getAssessments(projectId) {
    try {
      // Fetch all assessments with deliverable data, filter client-side
      // (Supabase doesn't support .or() or .in() on joined table columns)
      const { data: rawAssessments, error } = await supabase
        .from('deliverable_kpi_assessments')
        .select(`
          kpi_id,
          criteria_met,
          deliverables!inner(id, status, is_deleted, project_id)
        `)
        .eq('deliverables.project_id', projectId);

      if (error) {
        console.warn('KPIsService getAssessments warning:', error.message);
        // Try fallback query
        return await this.getAssessmentsFallback(projectId);
      }
      
      // Filter client-side for valid deliverables (not deleted + correct status)
      const assessments = (rawAssessments || []).filter(a => 
        a.deliverables?.is_deleted !== true &&
        VALID_STATUSES.deliverables.contributeToKPIs.includes(a.deliverables?.status)
      );
      
      return assessments;
    } catch (error) {
      console.error('KPIsService getAssessments error:', error);
      return [];
    }
  }

  /**
   * Fallback method if the join query doesn't work
   * Fetches assessments and filters client-side
   */
  async getAssessmentsFallback(projectId) {
    try {
      // Get all assessments with deliverable info
      const { data: assessments, error: assError } = await supabase
        .from('deliverable_kpi_assessments')
        .select('kpi_id, criteria_met, deliverable_id');

      if (assError) throw assError;

      // Get all deliverables for this project - filter client-side
      const { data: rawDeliverables, error: delError } = await supabase
        .from('deliverables')
        .select('id, status, is_deleted')
        .eq('project_id', projectId);

      if (delError) throw delError;

      // Filter client-side: not deleted + valid status
      const validDeliverableIds = new Set(
        (rawDeliverables || []).filter(d => 
          d.is_deleted !== true &&
          VALID_STATUSES.deliverables.contributeToKPIs.includes(d.status)
        ).map(d => d.id)
      );

      // Filter assessments to only include those from valid deliverables
      const filteredAssessments = (assessments || []).filter(a => 
        validDeliverableIds.has(a.deliverable_id)
      );

      return filteredAssessments;
    } catch (error) {
      console.error('KPIsService getAssessmentsFallback error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const kpisService = new KPIsService();
export default kpisService;
