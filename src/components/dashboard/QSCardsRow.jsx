/**
 * QS Cards Row
 * 
 * Horizontal row of cards showing metrics for each Quality Standard.
 * Each card displays: deliverables count, submitted, validated, pass rate.
 * 
 * @version 1.0
 * @created 6 December 2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award } from 'lucide-react';
import { qualityStandardsService, deliverablesService } from '../../services';
import { useProject } from '../../contexts/ProjectContext';
import { supabase } from '../../lib/supabase';
import { SkeletonMetricCard } from '../common';

export default function QSCardsRow({ refreshTrigger }) {
  const navigate = useNavigate();
  const { projectId } = useProject();
  
  const [loading, setLoading] = useState(true);
  const [qsStats, setQsStats] = useState([]);

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      // Get all Quality Standards
      const qualityStandards = await qualityStandardsService.getAll(projectId, {
        orderBy: { column: 'qs_ref', ascending: true }
      });

      // Get all deliverables with their QS links and status
      const { data: deliverables } = await supabase
        .from('deliverables')
        .select(`
          id, status, is_deleted,
          deliverable_quality_standards(quality_standard_id)
        `)
        .eq('project_id', projectId)
        .or('is_deleted.is.null,is_deleted.eq.false');

      // Get all QS assessments
      const { data: assessments } = await supabase
        .from('deliverable_qs_assessments')
        .select('quality_standard_id, deliverable_id, criteria_met');

      // Build assessment map by deliverable_id
      const assessmentMap = {};
      (assessments || []).forEach(a => {
        const key = `${a.deliverable_id}-${a.quality_standard_id}`;
        assessmentMap[key] = a.criteria_met;
      });

      // Calculate stats for each QS
      const stats = qualityStandards.map(qs => {
        // Find deliverables linked to this QS
        const linkedDeliverables = (deliverables || []).filter(d => 
          d.deliverable_quality_standards?.some(dqs => dqs.quality_standard_id === qs.id)
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
            const key = `${d.id}-${qs.id}`;
            if (assessmentMap[key] === true) passed++;
            else if (assessmentMap[key] === false) failed++;
          });

        const assessed = passed + failed;
        const passRate = assessed > 0 ? Math.round((passed / assessed) * 100) : null;

        return {
          id: qs.id,
          ref: qs.qs_ref,
          name: qs.name,
          total,
          submitted,
          validated,
          passed,
          failed,
          passRate
        };
      });

      setQsStats(stats);
    } catch (error) {
      console.error('QSCardsRow fetch error:', error);
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
          <Award size={18} />
          <span>Quality Standards Metrics</span>
        </div>
        <div className="metrics-cards-container">
          {[1, 2, 3, 4, 5].map(i => <SkeletonMetricCard key={i} />)}
        </div>
      </div>
    );
  }

  if (qsStats.length === 0) {
    return null;
  }

  return (
    <div className="metrics-cards-row">
      <div className="metrics-cards-header">
        <Award size={18} />
        <span>Quality Standards Metrics</span>
      </div>
      <div className="metrics-cards-container">
        {qsStats.map(qs => (
          <div 
            key={qs.id} 
            className="metrics-card qs-card"
            onClick={() => navigate(`/quality-standards/${qs.id}`)}
          >
            <div className="metrics-card-header">
              <span className="metrics-card-ref">{qs.ref}</span>
              <span className="metrics-card-name" title={qs.name}>{qs.name}</span>
            </div>
            <div className="metrics-card-stats">
              <div className="metrics-stat">
                <span className="metrics-stat-value">{qs.total}</span>
                <span className="metrics-stat-label">Deliverables</span>
              </div>
              <div className="metrics-stat">
                <span className="metrics-stat-value">{qs.submitted}</span>
                <span className="metrics-stat-label">Submitted</span>
              </div>
              <div className="metrics-stat">
                <span className="metrics-stat-value">{qs.validated}</span>
                <span className="metrics-stat-label">Validated</span>
              </div>
            </div>
            <div className="metrics-card-passrate">
              {qs.passRate !== null ? (
                <>
                  <div 
                    className="passrate-bar"
                    style={{ 
                      background: `linear-gradient(to right, #16a34a ${qs.passRate}%, #dc2626 ${qs.passRate}%)`
                    }}
                  />
                  <div className="passrate-values">
                    <span className="passrate-pass">{qs.passed} Yes</span>
                    <span className="passrate-percent">{qs.passRate}%</span>
                    <span className="passrate-fail">{qs.failed} No</span>
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
