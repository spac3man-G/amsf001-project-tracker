import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, ArrowLeft, Edit2, Save, X, Target, 
  FileText, Info, CheckCircle, AlertTriangle
} from 'lucide-react';

export default function KPIDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [userRole, setUserRole] = useState('viewer');
  const [editForm, setEditForm] = useState({});

  // KPI descriptions from SOW
  const sowDescriptions = {
    'KPI01': {
      title: 'Mobilisation & Project Deadlines',
      category: 'Time Performance',
      target: '90%',
      description: 'Measures the Supplier\'s ability to mobilise resources and meet project deadlines as agreed in the project plan.',
      measurement: 'Percentage of mobilisation milestones and project deadlines met on or before the agreed date.',
      frequency: 'Monthly',
      dataSource: 'Project schedule, milestone tracking reports',
      calculation: '(Number of deadlines met on time / Total number of deadlines) × 100',
      remediation: 'If performance falls below target, the Supplier must provide a recovery plan within 5 working days.'
    },
    'KPI02': {
      title: 'Timeliness of Delivery',
      category: 'Time Performance',
      target: '90%',
      description: 'Measures the Supplier\'s ability to deliver work products and services within agreed timescales.',
      measurement: 'Percentage of deliverables submitted on or before the agreed delivery date.',
      frequency: 'Monthly',
      dataSource: 'Delivery tracking log, acceptance records',
      calculation: '(Number of on-time deliveries / Total number of deliveries) × 100',
      remediation: 'Repeated failures may result in service credits or contract review.'
    },
    'KPI03': {
      title: 'First Time Quality of Deliverables',
      category: 'Time Performance',
      target: '90%',
      description: 'Measures the quality of deliverables on first submission, without requiring rework or resubmission.',
      measurement: 'Percentage of deliverables accepted on first submission without material changes.',
      frequency: 'Monthly',
      dataSource: 'Deliverable acceptance records, review feedback',
      calculation: '(Deliverables accepted first time / Total deliverables submitted) × 100',
      remediation: 'Quality improvement plan required if target not met for two consecutive months.'
    },
    'KPI04': {
      title: 'Second Time Quality of Deliverables',
      category: 'Quality of Collaboration',
      target: '95%',
      description: 'Measures the quality of deliverables after one round of feedback and revision.',
      measurement: 'Percentage of deliverables accepted after first revision following initial feedback.',
      frequency: 'Monthly',
      dataSource: 'Deliverable revision tracking, acceptance records',
      calculation: '(Deliverables accepted on second submission / Total resubmissions) × 100',
      remediation: 'Persistent issues require root cause analysis and corrective action plan.'
    },
    'KPI05': {
      title: 'Proactive Partnership',
      category: 'Quality of Collaboration',
      target: '90%',
      description: 'Measures the Supplier\'s proactive engagement and contribution to project success beyond contractual minimums.',
      measurement: 'Assessment score based on proactive suggestions, risk identification, and value-add contributions.',
      frequency: 'Quarterly',
      dataSource: 'Stakeholder feedback, meeting records, innovation log',
      calculation: 'Weighted score from stakeholder assessment (scale 1-100)',
      remediation: 'Engagement improvement plan if score falls below target.'
    },
    'KPI06': {
      title: 'Responsiveness',
      category: 'Quality of Collaboration',
      target: '90%',
      description: 'Measures the Supplier\'s responsiveness to queries, requests, and issues raised by the Authority.',
      measurement: 'Percentage of queries and requests responded to within agreed SLA timeframes.',
      frequency: 'Monthly',
      dataSource: 'Communication logs, ticket system, email records',
      calculation: '(Responses within SLA / Total queries) × 100',
      remediation: 'Communication protocol review if target not achieved.'
    },
    'KPI07': {
      title: 'Communication & Collaboration',
      category: 'Quality of Collaboration',
      target: '90%',
      description: 'Measures the effectiveness of communication and collaborative working between Supplier and Authority teams.',
      measurement: 'Assessment score based on communication clarity, meeting effectiveness, and stakeholder satisfaction.',
      frequency: 'Monthly',
      dataSource: 'Stakeholder surveys, meeting effectiveness reviews',
      calculation: 'Weighted score from collaboration assessment (scale 1-100)',
      remediation: 'Communication improvement workshop if target not met.'
    },
    'KPI08': {
      title: 'Planning & Reporting',
      category: 'Delivery Performance',
      target: '90%',
      description: 'Measures the quality and timeliness of project planning and reporting activities.',
      measurement: 'Percentage of reports delivered on time with required quality and completeness.',
      frequency: 'Monthly',
      dataSource: 'Report submission records, quality assessments',
      calculation: '(Compliant reports / Total reports due) × 100',
      remediation: 'Reporting process review and template updates if required.'
    },
    'KPI09': {
      title: 'Documentation Quality',
      category: 'Delivery Performance',
      target: '95%',
      description: 'Measures the quality, accuracy, and completeness of all project documentation.',
      measurement: 'Documentation quality score based on accuracy, completeness, and adherence to standards.',
      frequency: 'Monthly',
      dataSource: 'Document reviews, audit findings',
      calculation: 'Quality score from documentation audits (scale 1-100)',
      remediation: 'Documentation standards training if quality falls below target.'
    },
    'KPI10': {
      title: 'Risk Management',
      category: 'Delivery Performance',
      target: '90%',
      description: 'Measures the effectiveness of risk identification, assessment, and mitigation activities.',
      measurement: 'Percentage of identified risks with documented mitigation plans and timely updates.',
      frequency: 'Monthly',
      dataSource: 'Risk register, risk review meeting minutes',
      calculation: '(Risks with current mitigation plans / Total identified risks) × 100',
      remediation: 'Risk management process enhancement if target not achieved.'
    },
    'KPI11': {
      title: 'Innovation & Improvement',
      category: 'Delivery Performance',
      target: '90%',
      description: 'Measures the Supplier\'s contribution to innovation and continuous improvement.',
      measurement: 'Number and quality of improvement suggestions implemented or accepted for consideration.',
      frequency: 'Quarterly',
      dataSource: 'Innovation log, improvement tracker',
      calculation: 'Score based on quantity and impact of accepted improvements',
      remediation: 'Innovation workshop if contribution falls below expectations.'
    }
  };

  useEffect(() => {
    fetchKPI();
    fetchUserRole();
  }, [id]);

  async function fetchUserRole() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (data) setUserRole(data.role);
    }
  }

  async function fetchKPI() {
    try {
      const { data, error } = await supabase
        .from('kpis')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setKpi(data);
      setEditForm({
        name: data.name || '',
        category: data.category || '',
        target_value: data.target_value || '',
        current_value: data.current_value || '',
        description: data.description || '',
        measurement_method: data.measurement_method || '',
        frequency: data.frequency || '',
        data_source: data.data_source || '',
        calculation: data.calculation || '',
        remediation: data.remediation || '',
        notes: data.notes || ''
      });
    } catch (error) {
      console.error('Error fetching KPI:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      const { error } = await supabase
        .from('kpis')
        .update({
          name: editForm.name,
          category: editForm.category,
          target_value: parseFloat(editForm.target_value) || null,
          current_value: parseFloat(editForm.current_value) || null,
          description: editForm.description,
          measurement_method: editForm.measurement_method,
          frequency: editForm.frequency,
          data_source: editForm.data_source,
          calculation: editForm.calculation,
          remediation: editForm.remediation,
          notes: editForm.notes
        })
        .eq('id', id);

      if (error) throw error;
      await fetchKPI();
      setEditing(false);
      alert('KPI updated successfully!');
    } catch (error) {
      console.error('Error updating KPI:', error);
      alert('Failed to update KPI: ' + error.message);
    }
  }

  async function populateFromSOW() {
    const sowData = sowDescriptions[kpi?.kpi_id];
    if (sowData) {
      setEditForm({
        ...editForm,
        description: sowData.description,
        measurement_method: sowData.measurement,
        frequency: sowData.frequency,
        data_source: sowData.dataSource,
        calculation: sowData.calculation,
        remediation: sowData.remediation
      });
    }
  }

  function getStatusInfo(current, target) {
    const curr = parseFloat(current) || 0;
    const tgt = parseFloat(target) || 100;
    const percentage = (curr / tgt) * 100;
    
    if (curr === 0) return { status: 'Not Started', color: '#ef4444', bg: '#fef2f2' };
    if (percentage >= 100) return { status: 'Achieved', color: '#10b981', bg: '#f0fdf4' };
    if (percentage >= 80) return { status: 'On Track', color: '#3b82f6', bg: '#eff6ff' };
    if (percentage >= 60) return { status: 'At Risk', color: '#f59e0b', bg: '#fffbeb' };
    return { status: 'Critical', color: '#ef4444', bg: '#fef2f2' };
  }

  if (loading) {
    return <div className="loading">Loading KPI details...</div>;
  }

  if (!kpi) {
    return (
      <div className="page-container">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <AlertTriangle size={48} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
          <h2>KPI Not Found</h2>
          <p style={{ color: '#64748b' }}>The requested KPI could not be found.</p>
          <button className="btn btn-primary" onClick={() => navigate('/kpis')} style={{ marginTop: '1rem' }}>
            <ArrowLeft size={16} /> Back to KPIs
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(kpi.current_value, kpi.target_value);
  const sowData = sowDescriptions[kpi.kpi_id];
  const canEdit = userRole === 'admin' || userRole === 'contributor';

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <button 
            onClick={() => navigate('/kpis')} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '0.5rem' }}
          >
            <ArrowLeft size={24} />
          </button>
          <TrendingUp size={28} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1>{kpi.kpi_id}</h1>
              <span style={{ 
                padding: '0.25rem 0.75rem', 
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: '500',
                backgroundColor: statusInfo.bg,
                color: statusInfo.color
              }}>
                {statusInfo.status}
              </span>
            </div>
            <p>{kpi.name}</p>
          </div>
        </div>
        {canEdit && !editing && (
          <button className="btn btn-primary" onClick={() => setEditing(true)}>
            <Edit2 size={18} /> Edit KPI Details
          </button>
        )}
        {editing && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-primary" onClick={handleSave}>
              <Save size={18} /> Save Changes
            </button>
            <button className="btn btn-secondary" onClick={() => setEditing(false)}>
              <X size={18} /> Cancel
            </button>
          </div>
        )}
      </div>

      {/* Performance Summary */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Target</div>
          <div className="stat-value" style={{ color: '#3b82f6' }}>{kpi.target_value || '-'}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Current</div>
          <div className="stat-value" style={{ color: statusInfo.color }}>
            {kpi.current_value || '0'}%
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Category</div>
          <div className="stat-value" style={{ fontSize: '1rem' }}>{kpi.category}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Status</div>
          <div className="stat-value" style={{ color: statusInfo.color, fontSize: '1rem' }}>
            {statusInfo.status}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Left Column - Details */}
        <div>
          {/* Description */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Info size={20} /> Description
              </h3>
              {editing && sowData && (
                <button 
                  onClick={populateFromSOW}
                  style={{ 
                    padding: '0.25rem 0.75rem', 
                    fontSize: '0.85rem',
                    backgroundColor: '#dbeafe',
                    color: '#2563eb',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Load from SOW
                </button>
              )}
            </div>
            {editing ? (
              <textarea
                className="form-input"
                rows={4}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                placeholder="Enter KPI description..."
              />
            ) : (
              <p style={{ color: '#374151', lineHeight: '1.6' }}>
                {kpi.description || sowData?.description || 'No description available.'}
              </p>
            )}
          </div>

          {/* Measurement Method */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Target size={20} /> Measurement Method
            </h3>
            {editing ? (
              <textarea
                className="form-input"
                rows={3}
                value={editForm.measurement_method}
                onChange={(e) => setEditForm({ ...editForm, measurement_method: e.target.value })}
                placeholder="How is this KPI measured?"
              />
            ) : (
              <p style={{ color: '#374151', lineHeight: '1.6' }}>
                {kpi.measurement_method || sowData?.measurement || 'Not specified.'}
              </p>
            )}
          </div>

          {/* Calculation */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <FileText size={20} /> Calculation Formula
            </h3>
            {editing ? (
              <textarea
                className="form-input"
                rows={2}
                value={editForm.calculation}
                onChange={(e) => setEditForm({ ...editForm, calculation: e.target.value })}
                placeholder="Formula or method for calculating this KPI..."
              />
            ) : (
              <p style={{ 
                color: '#374151', 
                fontFamily: 'monospace', 
                backgroundColor: '#f1f5f9', 
                padding: '0.75rem',
                borderRadius: '4px'
              }}>
                {kpi.calculation || sowData?.calculation || 'Not specified.'}
              </p>
            )}
          </div>

          {/* Remediation */}
          <div className="card" style={{ marginBottom: '1.5rem', backgroundColor: '#fffbeb', borderLeft: '4px solid #f59e0b' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#92400e' }}>
              <AlertTriangle size={20} /> Remediation Actions
            </h3>
            {editing ? (
              <textarea
                className="form-input"
                rows={3}
                value={editForm.remediation}
                onChange={(e) => setEditForm({ ...editForm, remediation: e.target.value })}
                placeholder="What actions are required if target is not met?"
              />
            ) : (
              <p style={{ color: '#92400e', lineHeight: '1.6' }}>
                {kpi.remediation || sowData?.remediation || 'Not specified.'}
              </p>
            )}
          </div>
        </div>

        {/* Right Column - Metadata */}
        <div>
          {/* Quick Info */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>KPI Details</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>
                Frequency
              </label>
              {editing ? (
                <select
                  className="form-input"
                  value={editForm.frequency}
                  onChange={(e) => setEditForm({ ...editForm, frequency: e.target.value })}
                >
                  <option value="">Select frequency</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Annually">Annually</option>
                </select>
              ) : (
                <div style={{ fontWeight: '500' }}>
                  {kpi.frequency || sowData?.frequency || 'Not specified'}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>
                Data Source
              </label>
              {editing ? (
                <input
                  type="text"
                  className="form-input"
                  value={editForm.data_source}
                  onChange={(e) => setEditForm({ ...editForm, data_source: e.target.value })}
                  placeholder="Where does the data come from?"
                />
              ) : (
                <div style={{ fontWeight: '500' }}>
                  {kpi.data_source || sowData?.dataSource || 'Not specified'}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>
                Target Value
              </label>
              {editing ? (
                <input
                  type="number"
                  className="form-input"
                  value={editForm.target_value}
                  onChange={(e) => setEditForm({ ...editForm, target_value: e.target.value })}
                  placeholder="Target %"
                />
              ) : (
                <div style={{ fontWeight: '500' }}>{kpi.target_value || '-'}%</div>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: '#64748b', display: 'block', marginBottom: '0.25rem' }}>
                Current Value
              </label>
              {editing ? (
                <input
                  type="number"
                  className="form-input"
                  value={editForm.current_value}
                  onChange={(e) => setEditForm({ ...editForm, current_value: e.target.value })}
                  placeholder="Current %"
                />
              ) : (
                <div style={{ fontWeight: '500', color: statusInfo.color }}>{kpi.current_value || '0'}%</div>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Notes</h3>
            {editing ? (
              <textarea
                className="form-input"
                rows={4}
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                placeholder="Additional notes about this KPI..."
              />
            ) : (
              <p style={{ color: kpi.notes ? '#374151' : '#9ca3af', lineHeight: '1.6' }}>
                {kpi.notes || 'No additional notes.'}
              </p>
            )}
          </div>

          {/* SOW Reference */}
          {sowData && (
            <div className="card" style={{ marginTop: '1.5rem', backgroundColor: '#f0fdf4', borderLeft: '4px solid #22c55e' }}>
              <h4 style={{ color: '#166534', marginBottom: '0.5rem' }}>
                <CheckCircle size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
                SOW Reference
              </h4>
              <p style={{ color: '#166534', fontSize: '0.85rem' }}>
                This KPI is defined in the Statement of Work. Click "Load from SOW" while editing to populate fields with SOW definitions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
