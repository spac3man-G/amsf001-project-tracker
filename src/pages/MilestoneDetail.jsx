/**
 * Milestone Detail Page
 * 
 * Displays detailed information for a single milestone.
 * Currently stripped down for redesign.
 * 
 * @version 2.0 - Redesign in progress
 * @updated 5 December 2025
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { milestonesService, deliverablesService, timesheetsService } from '../services';
import { useProject } from '../contexts/ProjectContext';
import { Target, ArrowLeft, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '../components/common';
import './MilestoneDetail.css';

export default function MilestoneDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { project } = useProject();
  const [milestone, setMilestone] = useState(null);
  const [deliverables, setDeliverables] = useState([]);
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMilestoneData();
  }, [id]);

  // Calculate milestone status from its deliverables
  function calculateMilestoneStatus(deliverables) {
    if (!deliverables || deliverables.length === 0) {
      return 'Not Started';
    }

    const allNotStarted = deliverables.every(d => d.status === 'Not Started' || !d.status);
    const allDelivered = deliverables.every(d => d.status === 'Delivered');
    
    if (allDelivered) return 'Completed';
    if (allNotStarted) return 'Not Started';
    return 'In Progress';
  }

  async function fetchMilestoneData() {
    try {
      const milestoneData = await milestonesService.getById(id);
      
      if (!milestoneData) {
        setMilestone(null);
        setLoading(false);
        return;
      }
      
      setMilestone(milestoneData);

      // Fetch deliverables for this milestone
      const deliverablesData = await deliverablesService.getAll(project.id, {
        filters: [{ column: 'milestone_id', operator: 'eq', value: id }],
        select: '*, deliverable_kpis(kpi_id, kpis(kpi_ref, name))',
        orderBy: { column: 'deliverable_ref', ascending: true }
      });
      setDeliverables(deliverablesData || []);

      // Fetch timesheets for this milestone
      const timesheetsData = await timesheetsService.getAll(project.id, {
        filters: [{ column: 'milestone_id', operator: 'eq', value: id }],
        select: '*, resources(id, name, sell_price, discount_percent)',
        orderBy: { column: 'date', ascending: false }
      });
      setTimesheets(timesheetsData || []);
    } catch (error) {
      console.error('Error fetching milestone data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading milestone..." size="large" fullPage />;
  }

  if (!milestone) {
    return (
      <div className="milestone-detail-page">
        <div className="milestone-not-found">
          <AlertCircle size={48} />
          <h2>Milestone Not Found</h2>
          <button onClick={() => navigate('/milestones')}>
            <ArrowLeft size={16} /> Back to Milestones
          </button>
        </div>
      </div>
    );
  }

  // Calculate derived data
  const computedStatus = calculateMilestoneStatus(deliverables);
  const totalDeliverables = deliverables.length;
  const progress = totalDeliverables > 0 
    ? Math.round(deliverables.reduce((sum, d) => sum + (d.progress || 0), 0) / totalDeliverables) 
    : 0;

  return (
    <div className="milestone-detail-page">
      {/* Header */}
      <header className="milestone-header">
        <button className="back-button" onClick={() => navigate('/milestones')}>
          <ArrowLeft size={20} />
        </button>
        <div className="milestone-icon">
          <Target size={24} />
        </div>
        <div className="milestone-title-block">
          <div className="milestone-ref-row">
            <span className="milestone-ref">{milestone.milestone_ref}</span>
            <span className={`milestone-status status-${computedStatus.toLowerCase().replace(' ', '-')}`}>
              {computedStatus}
            </span>
          </div>
          <h1 className="milestone-name">{milestone.name}</h1>
        </div>
      </header>

      {/* Content area - stripped for redesign */}
      <div className="milestone-content">
        {/* Content will be added back incrementally */}
      </div>
    </div>
  );
}
