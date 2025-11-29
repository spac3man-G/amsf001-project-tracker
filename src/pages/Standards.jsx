import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LoadingSpinner } from '../components/common';
import { BookOpen, CheckCircle, Clock, FileText } from 'lucide-react';

export default function Standards() {
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStandards();
  }, []);

  async function fetchStandards() {
    try {
      const { data, error } = await supabase
        .from('standards')
        .select('*')
        .order('standard_ref');

      if (error) throw error;
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
      <div className="page-header">
        <div className="page-title">
          <BookOpen size={28} />
          <div>
            <h1>Network Standards</h1>
            <p>Document and track 32 network standards</p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Total Standards</div>
          <div className="stat-value">{standards.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-value" style={{ color: '#10b981' }}>{completed}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">In Progress</div>
          <div className="stat-value" style={{ color: '#3b82f6' }}>{inProgress}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Not Started</div>
          <div className="stat-value" style={{ color: '#64748b' }}>{notStarted}</div>
        </div>
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
