import React, { useState, useEffect } from 'react';
import { standardsService } from '../services';
import { LoadingSpinner, PageHeader, StatCard } from '../components/common';
import { BookOpen, CheckCircle, Clock, FileText } from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';

export default function Standards() {
  const { projectId } = useProject();
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      fetchStandards();
    }
  }, [projectId]);

  async function fetchStandards() {
    try {
      const data = await standardsService.getAll(projectId);
      setStandards(data || []);
    } catch (error) {
      console.error('Error fetching standards:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case 'Completed': return 'status-completed';
      case 'In Progress': return 'status-in-progress';
      case 'Not Started': return 'status-not-started';
      default: return 'status-not-started';
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading standards..." size="large" fullPage />;
  }

  const completed = standards.filter(s => s.status === 'Completed').length;
  const inProgress = standards.filter(s => s.status === 'In Progress').length;
  const notStarted = standards.filter(s => s.status === 'Not Started' || !s.status).length;

  return (
    <div className="page-container">
      <PageHeader
        icon={BookOpen}
        title="Network Standards"
        subtitle="Document and track 32 network standards"
      />

      {/* Summary Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <StatCard
          icon={BookOpen}
          label="Total Standards"
          value={standards.length}
          color="#3b82f6"
        />
        <StatCard
          icon={CheckCircle}
          label="Completed"
          value={completed}
          color="#10b981"
        />
        <StatCard
          icon={Clock}
          label="In Progress"
          value={inProgress}
          color="#3b82f6"
        />
        <StatCard
          icon={FileText}
          label="Not Started"
          value={notStarted}
          color="#64748b"
        />
      </div>

      {/* Standards Table */}
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Ref</th>
              <th>Standard Name</th>
              <th>Category</th>
              <th>Status</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {standards.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                  No standards found. Standards will be populated as the project progresses.
                </td>
              </tr>
            ) : (
              standards.map(standard => (
                <tr key={standard.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>{standard.standard_ref}</td>
                  <td style={{ fontWeight: '500' }}>{standard.name}</td>
                  <td>{standard.category || '-'}</td>
                  <td>
                    <span className={`status-badge ${getStatusColor(standard.status)}`}>
                      {standard.status || 'Not Started'}
                    </span>
                  </td>
                  <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {standard.description || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Info Box */}
      <div className="card" style={{ marginTop: '1.5rem', backgroundColor: '#eff6ff', borderLeft: '4px solid #3b82f6' }}>
        <h4 style={{ marginBottom: '0.5rem', color: '#1e40af' }}>📋 About Network Standards</h4>
        <p style={{ color: '#1e40af', fontSize: '0.9rem' }}>
          This project will document 32 network standards across multiple categories including 
          DC On-Premises, DC Cloud, Sites (Large/Medium/Small/Micro), and Connectivity Services.
        </p>
      </div>
    </div>
  );
}
