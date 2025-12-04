/**
 * Milestone Table Component
 * 
 * Main table displaying all milestones with:
 * - Status and progress indicators
 * - Certificate generation/viewing
 * - Edit/Delete actions
 * 
 * @version 1.0
 * @created 1 December 2025
 * @extracted-from Milestones.jsx
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Edit2, Trash2, FileCheck, Award } from 'lucide-react';

function getStatusColor(status) {
  switch (status) {
    case 'Completed': return { bg: '#dcfce7', color: '#16a34a' };
    case 'In Progress': return { bg: '#dbeafe', color: '#2563eb' };
    default: return { bg: '#f1f5f9', color: '#64748b' };
  }
}

function getCertificateStatusColor(status) {
  switch (status) {
    case 'Signed': return { bg: '#dcfce7', color: '#16a34a' };
    case 'Pending Supplier Signature': return { bg: '#fef3c7', color: '#d97706' };
    case 'Pending Customer Signature': return { bg: '#dbeafe', color: '#2563eb' };
    case 'Draft': return { bg: '#f1f5f9', color: '#64748b' };
    default: return { bg: '#f1f5f9', color: '#64748b' };
  }
}

export default function MilestoneTable({
  milestones,
  milestoneDeliverables,
  certificates,
  canEdit,
  onEdit,
  onDelete,
  onGenerateCertificate,
  onViewCertificate
}) {
  const navigate = useNavigate();
  return (
    <div className="card">
      <h3 style={{ marginBottom: '1rem' }}>Project Milestones</h3>
      <table>
        <thead>
          <tr>
            <th>Ref</th>
            <th>Name</th>
            <th>Status</th>
            <th>Progress</th>
            <th>Actual Start</th>
            <th>Forecast End</th>
            <th title="Amount invoiced on completion">Billable</th>
            <th>Certificate</th>
            {canEdit && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {milestones.length === 0 ? (
            <tr>
              <td colSpan={canEdit ? 9 : 8} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                No milestones found. Click "Add Milestone" to create one.
              </td>
            </tr>
          ) : (
            milestones.map(milestone => {
              const statusColors = getStatusColor(milestone.computedStatus);
              const cert = certificates[milestone.id];
              const deliverableCount = milestoneDeliverables[milestone.id]?.length || 0;
              
              return (
                <tr 
                  key={milestone.id}
                  onClick={() => navigate(`/milestones/${milestone.id}`)}
                  style={{ cursor: 'pointer' }}
                  className="table-row-clickable"
                >
                  <td style={{ fontFamily: 'monospace', fontWeight: '600', color: '#3b82f6' }}>
                    {milestone.milestone_ref}
                  </td>
                  <td style={{ fontWeight: '500' }}>{milestone.name}</td>
                  <td>
                    <span style={{ 
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      backgroundColor: statusColors.bg,
                      color: statusColors.color,
                      fontWeight: '500'
                    }}>
                      {milestone.computedStatus}
                    </span>
                    {deliverableCount > 0 && (
                      <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                        ({deliverableCount} deliverable{deliverableCount !== 1 ? 's' : ''})
                      </span>
                    )}
                  </td>
                  <td>
                    <ProgressBar 
                      progress={milestone.computedProgress} 
                      isCompleted={milestone.computedStatus === 'Completed'} 
                    />
                  </td>
                  <td>
                    {(milestone.actual_start_date || milestone.start_date) 
                      ? new Date(milestone.actual_start_date || milestone.start_date).toLocaleDateString('en-GB') 
                      : '-'}
                  </td>
                  <td>
                    {(milestone.forecast_end_date || milestone.end_date) 
                      ? new Date(milestone.forecast_end_date || milestone.end_date).toLocaleDateString('en-GB') 
                      : '-'}
                  </td>
                  <td title="Invoiced on completion">£{(milestone.billable || 0).toLocaleString()}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <CertificateCell
                      milestone={milestone}
                      certificate={cert}
                      canEdit={canEdit}
                      onGenerate={() => onGenerateCertificate(milestone)}
                      onView={() => onViewCertificate(milestone)}
                    />
                  </td>
                  {canEdit && (
                    <td onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button 
                          onClick={() => onEdit(milestone)}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: '#eff6ff',
                            color: '#3b82f6',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => onDelete(milestone)}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: '#fef2f2',
                            color: '#ef4444',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function ProgressBar({ progress, isCompleted }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <div style={{ 
        width: '80px', 
        height: '8px', 
        backgroundColor: '#e2e8f0', 
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{ 
          width: `${progress}%`, 
          height: '100%', 
          backgroundColor: isCompleted ? '#10b981' : '#3b82f6',
          transition: 'width 0.3s'
        }}></div>
      </div>
      <span style={{ fontSize: '0.85rem', fontWeight: '600', minWidth: '40px' }}>
        {progress}%
      </span>
      <span style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
        (auto)
      </span>
    </div>
  );
}

function CertificateCell({ milestone, certificate, canEdit, onGenerate, onView }) {
  if (milestone.computedStatus !== 'Completed') {
    return <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Not ready</span>;
  }

  if (certificate) {
    const colors = getCertificateStatusColor(certificate.status);
    const label = certificate.status === 'Signed' ? 'Signed' : 
                  certificate.status === 'Pending Customer Signature' ? 'Awaiting Customer' :
                  certificate.status === 'Pending Supplier Signature' ? 'Awaiting Supplier' : 'View';
    
    return (
      <button
        onClick={onView}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.25rem 0.5rem',
          backgroundColor: colors.bg,
          color: colors.color,
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.8rem',
          fontWeight: '500'
        }}
      >
        <FileCheck size={14} />
        {label}
      </button>
    );
  }

  if (canEdit) {
    return (
      <button
        onClick={onGenerate}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          padding: '0.25rem 0.5rem',
          backgroundColor: '#fef3c7',
          color: '#d97706',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.8rem',
          fontWeight: '500'
        }}
      >
        <Award size={14} />
        Generate
      </button>
    );
  }

  return null;
}

/**
 * Certificate Stats Banner
 */
export function CertificateStatsCard({ signedCount, pendingCount, awaitingCount }) {
  return (
    <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: '#fefce8', borderLeft: '4px solid #eab308' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <Award size={24} style={{ color: '#ca8a04' }} />
        <h4 style={{ margin: 0, color: '#854d0e' }}>Milestone Acceptance Certificates</h4>
        <div style={{ display: 'flex', gap: '1.5rem', marginLeft: 'auto' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16a34a' }}>{signedCount}</div>
            <div style={{ fontSize: '0.8rem', color: '#166534' }}>Signed</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#d97706' }}>{pendingCount}</div>
            <div style={{ fontSize: '0.8rem', color: '#92400e' }}>Pending</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: awaitingCount > 0 ? '#dc2626' : '#64748b' }}>
              {awaitingCount > 0 ? awaitingCount : 0}
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Awaiting Generation</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Info Box - How milestones work
 */
export function MilestoneInfoBox() {
  return (
    <div className="card" style={{ marginTop: '1.5rem', backgroundColor: '#eff6ff', borderLeft: '4px solid #3b82f6' }}>
      <h4 style={{ marginBottom: '0.5rem', color: '#1e40af' }}>💡 How Milestone Status & Progress Work</h4>
      <ul style={{ margin: '0.5rem 0 0 1.5rem', color: '#1e40af', fontSize: '0.9rem' }}>
        <li>Milestone <strong>status</strong> and <strong>progress</strong> are automatically calculated from deliverables</li>
        <li><strong>Not Started:</strong> All deliverables are "Not Started" (or no deliverables exist)</li>
        <li><strong>In Progress:</strong> At least one deliverable has begun work</li>
        <li><strong>Completed:</strong> All deliverables have been delivered</li>
        <li>Click milestone reference to view and manage deliverables</li>
        <li>Progress = average of all deliverable progress percentages</li>
        <li>Timesheets continue to be logged against milestones (not individual deliverables)</li>
        <li>Payment aligned to milestone completion per SOW requirements</li>
      </ul>
    </div>
  );
}
