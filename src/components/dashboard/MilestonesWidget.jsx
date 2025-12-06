/**
 * Milestones Widget
 * 
 * Dashboard widget showing milestone progress breakdown.
 * Clicking anywhere navigates to the Milestones page.
 * 
 * @version 1.0
 * @created 4 December 2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Milestone, CheckCircle, Clock, FileText, Circle } from 'lucide-react';
import { milestonesService, deliverablesService } from '../../services';
import { useProject } from '../../contexts/ProjectContext';
import { SkeletonWidget } from '../common';

export default function MilestonesWidget({ refreshTrigger }) {
  const navigate = useNavigate();
  const { projectId } = useProject();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    awaitingSignatures: 0,
    awaitingCertificate: 0,
    inProgress: 0
  });

  const fetchData = useCallback(async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      // Fetch milestones
      const milestones = await milestonesService.getAll(projectId, {
        orderBy: { column: 'milestone_ref', ascending: true }
      });

      // Fetch all deliverables for these milestones
      const milestoneIds = milestones.map(m => m.id);
      let milestoneDeliverables = {};
      
      if (milestoneIds.length > 0) {
        const deliverables = await deliverablesService.getAll(projectId, {
          filters: [{ column: 'milestone_id', operator: 'in', value: milestoneIds }],
          select: 'id, milestone_id, status'
        });
        
        // Group deliverables by milestone
        (deliverables || []).forEach(d => {
          if (!milestoneDeliverables[d.milestone_id]) {
            milestoneDeliverables[d.milestone_id] = [];
          }
          milestoneDeliverables[d.milestone_id].push(d);
        });
      }

      // Fetch certificates
      const certificates = await milestonesService.getCertificates(projectId);
      const certsMap = {};
      certificates.forEach(cert => { certsMap[cert.milestone_id] = cert; });

      // Calculate stats
      let approved = 0;
      let awaitingSignatures = 0;
      let awaitingCertificate = 0;
      let inProgress = 0;

      milestones.forEach(milestone => {
        const deliverables = milestoneDeliverables[milestone.id] || [];
        const allDelivered = deliverables.length > 0 && 
          deliverables.every(d => d.status === 'Delivered');
        const certificate = certsMap[milestone.id];

        if (certificate && certificate.status === 'Signed') {
          // Fully approved - both PMs signed
          approved++;
        } else if (certificate) {
          // Certificate exists but not fully signed
          awaitingSignatures++;
        } else if (allDelivered) {
          // Completed but no certificate generated yet
          awaitingCertificate++;
        } else {
          // Still in progress (or not started)
          inProgress++;
        }
      });

      setStats({
        total: milestones.length,
        approved,
        awaitingSignatures,
        awaitingCertificate,
        inProgress
      });
    } catch (error) {
      console.error('MilestonesWidget fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  const handleClick = () => {
    navigate('/milestones');
  };

  if (loading) {
    return <SkeletonWidget rows={4} />;
  }

  return (
    <div className="dashboard-widget" onClick={handleClick}>
      <div className="widget-header">
        <div className="widget-icon">
          <Milestone size={20} />
        </div>
        <span className="widget-title">Milestones</span>
        <span className="widget-total">{stats.total} Total</span>
      </div>
      
      <div className="widget-breakdown">
        <div className="widget-row">
          <div className="widget-row-icon approved">
            <CheckCircle size={16} />
          </div>
          <span className="widget-row-label">Approved (Signed)</span>
          <span className="widget-row-value">{stats.approved}</span>
        </div>
        
        <div className="widget-row">
          <div className="widget-row-icon pending">
            <Clock size={16} />
          </div>
          <span className="widget-row-label">Awaiting Signatures</span>
          <span className="widget-row-value">{stats.awaitingSignatures}</span>
        </div>
        
        <div className="widget-row">
          <div className="widget-row-icon awaiting">
            <FileText size={16} />
          </div>
          <span className="widget-row-label">Awaiting Certificate</span>
          <span className="widget-row-value">{stats.awaitingCertificate}</span>
        </div>
        
        <div className="widget-row">
          <div className="widget-row-icon progress">
            <Circle size={16} />
          </div>
          <span className="widget-row-label">In Progress</span>
          <span className="widget-row-value">{stats.inProgress}</span>
        </div>
      </div>
    </div>
  );
}
