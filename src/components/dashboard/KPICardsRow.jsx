/**
 * KPI Cards Row
 * 
 * Horizontal row of cards showing metrics for each KPI.
 * Each card displays: deliverables count, submitted, validated, pass rate.
 * 
 * @version 1.0
 * @created 6 December 2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, CheckCircle, Clock, ThumbsUp } from 'lucide-react';
import { kpisService, deliverablesService } from '../../services';
import { useProject } from '../../contexts/ProjectContext';
import { supabase } from '../../lib/supabase';
import { SkeletonMetricCard } from '../common';

export default function KPICardsRow({ refreshTrigger }) {
  const navigate = useNavigate();
  const { projectId } = useProject();
  
  const [loading, setLoading] = useState(true);
  const [kpiStats, setKpiStats] = useState([]);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      // Get all KPIs
      const kpis = await kpisService.getAll(projectId, {
        orderBy: { column: 'kpi_ref', ascending: true }
      });

      // Get all deliverables with their KPI links and status
      const { data: deliverables } = await supabase
        .from('deliverables')
        .select(`
          id, status, is_deleted,
          deliverable_kpis(kpi_id)
        `)
        .eq('project_id', projectId)
        .or('is_deleted.is.null,is_deleted.eq.false');

      // Get all KPI assessments
      const { data: assessments } = await supabase
        .from('deliverable_kpi_assessments')
        .select('kpi_id, deliverable_id, criteria_met');

      // Build assessment map by deliverable_id
      const assessmentMap = {};
      (assessments || []).forEach(a => {
        const key = `${a.deliverable_id}-${a.kpi_id}`;
        assessmentMap[key] = a.criteria_met;
      });

      // Calculate stats for each KPI
      const stats = kpis.map(kpi => {
        // Find deliverables linked to this KPI
        const linkedDeliverables = (deliverables || []).filter(d => 
          d.deliverable_kpis?.some(dk => dk.kpi_id === kpi.id)
        );

        const total = linkedDeliverables.length;
        const submitted = linkedDeliverables.filter(d => 
          d.status === 'Submitted for Review'
        ).length;
        const validated = linkedDeliverables.filter(d => 
          d.status === 'Delivered'
        ).length;

        // Calculate pass rate from assessments (only for Delivered deliverables)
        let passed = 0;
        let failed = 0;
        linkedDeliverables
          .filter(d => d.status === 'Delivered')
          .forEach(d => {
            const key = `${d.id}-${kpi.id}`;
            if (assessmentMap[key] === true) passed++;
            else if (assessmentMap[key] === false) failed++;
          });

        const assessed = passed + failed;
        const passRate = assessed > 0 ? Math.round((passed / assessed) * 100) : null;

        return {
          id: kpi.id,
          ref: kpi.kpi_ref,
          name: kpi.name,
          total,
          submitted,
          validated,
          passed,
          failed,
          passRate
        };
      });

      setKpiStats(stats);
    } catch (error) {
      console.error('KPICardsRow fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  if (loading) {
    return (
      <div className="metrics-cards-row">
        <div className="metrics-cards-header">
          <TrendingUp size={18} />
          <span>KPI Metrics</span>
        </div>
        <div className="metrics-cards-container">
          {[1, 2, 3, 4, 5].map(i => <SkeletonMetricCard key={i} />)}
        </div>
      </div>
    );
  }

  if (kpiStats.length === 0) {
    return null;
  }

  return (
    <div className="metrics-cards-row">
      <div className="metrics-cards-header">
        <TrendingUp size={18} />
        <span>KPI Metrics</span>
      </div>
      <div className="metrics-cards-container">
        {kpiStats.map(kpi => (
          <div 
            key={kpi.id} 
            className="metrics-card kpi-card"
            onClick={() => navigate(`/kpis/${kpi.id}`)}
          >
            <div className="metrics-card-header">
              <span className="metrics-card-ref">{kpi.ref}</span>
              <span className="metrics-card-name" title={kpi.name}>{kpi.name}</span>
            </div>
            <div className="metrics-card-stats">
              <div className="metrics-stat">
                <span className="metrics-stat-value">{kpi.total}</span>
                <span className="metrics-stat-label">Deliverables</span>
              </div>
              <div className="metrics-stat">
                <span className="metrics-stat-value">{kpi.submitted}</span>
                <span className="metrics-stat-label">Submitted</span>
              </div>
              <div className="metrics-stat">
                <span className="metrics-stat-value">{kpi.validated}</span>
                <span className="metrics-stat-label">Validated</span>
              </div>
            </div>
            <div className="metrics-card-passrate">
              {kpi.passRate !== null ? (
                <>
                  <div 
                    className="passrate-bar"
                    style={{ 
                      background: `linear-gradient(to right, #16a34a ${kpi.passRate}%, #dc2626 ${kpi.passRate}%)`
                    }}
                  />
                  <div className="passrate-values">
                    <span className="passrate-pass">{kpi.passed} Yes</span>
                    <span className="passrate-percent">{kpi.passRate}%</span>
                    <span className="passrate-fail">{kpi.failed} No</span>
                  </div>
                </>
              ) : (
                <div className="passrate-none">No assessments yet</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
