import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  ArrowLeft, Award, CheckCircle, AlertCircle, Clock, 
  Save, X, Edit2, Target, FileText, Clipboard
} from 'lucide-react';
import { LoadingSpinner, PageHeader, StatusBadge } from '../components/common';

export default function QualityStandardDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [qs, setQS] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [userRole, setUserRole] = useState('viewer');

  useEffect(() => {
    fetchQualityStandard();
  }, [id]);

  async function fetchQualityStandard() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile) setUserRole(profile.role);
      }

      const { data, error } = await supabase
        .from('quality_standards')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setQS(data);
      setEditForm(data);

      // Fetch assessments with deliverable info
      const { data: assessmentData } = await supabase
        .from('deliverable_qs_assessments')
        .select(`
          *,
          deliverables(deliverable_ref, name, status)
        `)
        .eq('quality_standard_id', id)
        .order('assessed_at', { ascending: false });

      setAssessments(assessmentData || []);

    } catch (error) {
      console.error('Error fetching quality standard:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      const { error } = await supabase
        .from('quality_standards')
        .update({
          description: editForm.description,
          measurement_criteria: editForm.measurement_criteria,
          compliance_expectation: editForm.compliance_expectation,
          target: parseFloat(editForm.target) || 100,
          notes: editForm.notes
        })
        .eq('id', id);

      if (error) throw error;
      setQS({ ...qs, ...editForm });
      setEditing(false);
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save changes');
    }
  }

  function getStatusInfo() {
    const total = assessments.filter(a => a.criteria_met !== null).length;
    const met = assessments.filter(a => a.criteria_met === true).length;

    if (total === 0) {
      return { label: 'Not Started', color: '#64748b', bg: '#f1f5f9' };
    }

    const percentage = (met / total) * 100;
    const target = qs?.target || 100;

    if (percentage >= target) {
      return { label: 'Achieved', color: '#16a34a', bg: '#dcfce7' };
    } else if (percentage >= target * 0.8) {
      return { label: 'On Track', color: '#2563eb', bg: '#dbeafe' };
    } else if (percentage >= target * 0.6) {
      return { label: 'At Risk', color: '#ea580c', bg: '#ffedd5' };
    } else {
      return { label: 'Critical', color: '#dc2626', bg: '#fee2e2' };
    }
  }

  const canEdit = userRole === 'admin' || userRole === 'contributor' || userRole === 'customer_pm';

  if (loading) return <LoadingSpinner message="Loading quality standard..." size="large" fullPage />;
  if (!qs) return <div className="loading">Quality Standard not found</div>;

  const status = getStatusInfo();
  const totalAssessments = assessments.filter(a => a.criteria_met !== null).length;
  const metAssessments = assessments.filter(a => a.criteria_met === true).length;

  return (
    <div className="page-container">
      {/* Back button */}
      <button
        onClick={() => navigate('/quality-standards')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          backgroundColor: 'transparent',
          border: 'none',
          color: '#64748b',
          cursor: 'pointer',
          marginBottom: '1rem'
        }}
      >
        <ArrowLeft size={20} />
        Back to Quality Standards
      </button>

      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Award size={32} style={{ color: '#8b5cf6' }} />
          <div>
            <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ 
                fontFamily: 'monospace', 
                backgroundColor: '#f3e8ff', 
                color: '#7c3aed',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px'
              }}>
                {qs.qs_ref}
              </span>
              {qs.name}
            </h1>
            <span style={{
              display: 'inline-block',
              marginTop: '0.5rem',
              padding: '0.25rem 0.75rem',
              borderRadius: '4px',
              fontSize: '0.9rem',
              fontWeight: '500',
              backgroundColor: status.bg,
              color: status.color
            }}>
              {status.label}
            </span>
          </div>
        </div>

        {canEdit && !editing && (
          <button
            onClick={() => setEditing(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <Edit2 size={16} />
            Edit
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">
            <Target size={18} style={{ color: '#8b5cf6' }} />
            Target
          </div>
          <div className="stat-value">{qs.target}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">
            <CheckCircle size={18} style={{ color: '#16a34a' }} />
            Current Score
          </div>
          <div className="stat-value" style={{ 
            color: qs.current_value >= qs.target ? '#16a34a' : '#64748b' 
          }}>
            {qs.current_value}%
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">
            <FileText size={18} style={{ color: '#3b82f6' }} />
            Assessments
          </div>
          <div className="stat-value">{metAssessments}/{totalAssessments}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">
            <Clock size={18} style={{ color: '#f59e0b' }} />
            Last Measured
          </div>
          <div className="stat-value" style={{ fontSize: '1rem' }}>
            {qs.last_measured 
              ? new Date(qs.last_measured).toLocaleDateString('en-GB')
              : 'Never'
            }
          </div>
        </div>
      </div>

      {/* Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Left Column */}
        <div>
          {/* Description */}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} style={{ color: '#8b5cf6' }} />
              Description
            </h3>
            {editing ? (
              <textarea
                value={editForm.description || ''}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                style={{ width: '100%', minHeight: '100px' }}
              />
            ) : (
              <p style={{ margin: 0, color: '#374151', lineHeight: '1.6' }}>
                {qs.description || 'No description provided'}
              </p>
            )}
          </div>

          {/* Measurement Criteria */}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clipboard size={20} style={{ color: '#3b82f6' }} />
              Measurement Criteria
            </h3>
            {editing ? (
              <textarea
                value={editForm.measurement_criteria || ''}
                onChange={(e) => setEditForm({ ...editForm, measurement_criteria: e.target.value })}
                style={{ width: '100%', minHeight: '80px' }}
              />
            ) : (
              <p style={{ margin: 0, color: '#374151', lineHeight: '1.6' }}>
                {qs.measurement_criteria || 'Not specified'}
              </p>
            )}
          </div>

          {/* Compliance Expectation */}
          <div className="card" style={{ 
            marginBottom: '1rem',
            backgroundColor: '#fefce8',
            border: '1px solid #fef08a'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a16207' }}>
              <Target size={20} />
              Compliance Expectation
            </h3>
            {editing ? (
              <textarea
                value={editForm.compliance_expectation || ''}
                onChange={(e) => setEditForm({ ...editForm, compliance_expectation: e.target.value })}
                style={{ width: '100%', minHeight: '60px' }}
              />
            ) : (
              <p style={{ margin: 0, color: '#a16207', fontWeight: '500' }}>
                {qs.compliance_expectation || 'Not specified'}
              </p>
            )}
          </div>

          {/* Assessments History */}
          <div className="card">
            <h3 style={{ margin: '0 0 1rem 0' }}>Assessment History</h3>
            {assessments.length === 0 ? (
              <p style={{ color: '#64748b', fontStyle: 'italic' }}>
                No assessments yet. This standard will be assessed when deliverables are marked as delivered.
              </p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Deliverable</th>
                    <th>Result</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map(assessment => (
                    <tr key={assessment.id}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                          {assessment.deliverables?.deliverable_ref}
                        </span>
                        {' - '}
                        {assessment.deliverables?.name}
                      </td>
                      <td>
                        {assessment.criteria_met === true ? (
                          <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckCircle size={16} /> Met
                          </span>
                        ) : assessment.criteria_met === false ? (
                          <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <AlertCircle size={16} /> Not Met
                          </span>
                        ) : (
                          <span style={{ color: '#64748b' }}>Pending</span>
                        )}
                      </td>
                      <td>
                        {assessment.assessed_at 
                          ? new Date(assessment.assessed_at).toLocaleDateString('en-GB')
                          : '-'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div>
          <div className="card">
            <h3 style={{ margin: '0 0 1rem 0' }}>Quick Info</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: '500', color: '#64748b', fontSize: '0.85rem' }}>
                Target
              </label>
              {editing ? (
                <input
                  type="number"
                  value={editForm.target || 100}
                  onChange={(e) => setEditForm({ ...editForm, target: e.target.value })}
                  style={{ width: '100%' }}
                />
              ) : (
                <p style={{ margin: '0.25rem 0 0 0', fontWeight: '600' }}>{qs.target}%</p>
              )}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: '500', color: '#64748b', fontSize: '0.85rem' }}>
                Current Value
              </label>
              <p style={{ 
                margin: '0.25rem 0 0 0', 
                fontWeight: '600',
                color: qs.current_value >= qs.target ? '#16a34a' : '#64748b'
              }}>
                {qs.current_value}%
              </p>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: '500', color: '#64748b', fontSize: '0.85rem' }}>
                Notes
              </label>
              {editing ? (
                <textarea
                  value={editForm.notes || ''}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  style={{ width: '100%', minHeight: '100px' }}
                  placeholder="Add notes..."
                />
              ) : (
                <p style={{ margin: '0.25rem 0 0 0', color: '#374151' }}>
                  {qs.notes || 'No notes'}
                </p>
              )}
            </div>
          </div>

          {/* Edit Actions */}
          {editing && (
            <div style={{ 
              display: 'flex', 
              gap: '0.5rem', 
              marginTop: '1rem'
            }}>
              <button
                onClick={handleSave}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: '#16a34a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                <Save size={18} />
                Save
              </button>
              <button
                onClick={() => {
                  setEditForm(qs);
                  setEditing(false);
                }}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: '#64748b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
                Cancel
              </button>
            </div>
          )}

          {/* SOW Reference */}
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#f0fdf4',
            borderRadius: '8px',
            border: '1px solid #bbf7d0'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#166534' }}>
              SOW Reference
            </h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#166534' }}>
              This quality standard is defined in the Statement of Work - Quality Standards section.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
