/**
 * KPIs Service
 * 
 * Handles all KPI-related data operations.
 * 
 * @version 1.0
 * @created 30 November 2025
 * @phase Phase 1 - Stabilisation
 */

import { BaseService } from './base.service';
import { supabase } from '../lib/supabase';

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
    if (!kpi.target_value || kpi.actual_value === null || kpi.actual_value === undefined) {
      return 'Unknown';
    }

    const actual = parseFloat(kpi.actual_value);
    const target = parseFloat(kpi.target_value);
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
   */
  async getAssessments(projectId) {
    try {
      const { data, error } = await supabase
        .from('deliverable_kpi_assessments')
        .select('kpi_id, criteria_met')
        .eq('project_id', projectId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('KPIsService getAssessments error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const kpisService = new KPIsService();
export default kpisService;
