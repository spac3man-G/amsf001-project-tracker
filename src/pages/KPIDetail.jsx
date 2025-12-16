import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { kpisService } from '../services';
import { useProject } from '../contexts/ProjectContext';
import { 
  TrendingUp, ArrowLeft, Edit2, Save, X, Target, 
  FileText, Info, CheckCircle, AlertTriangle, RefreshCw
} from 'lucide-react';
// Note: useAuth removed - permissions now use project role via usePermissions hook
import { usePermissions } from '../hooks/usePermissions';
import { LoadingSpinner, PageHeader, StatusBadge } from '../components/common';

export default function KPIDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { project } = useProject();
  
  // Use the permissions hook - clean, pre-bound permission functions
  const { canManageKPIs } = usePermissions();
  
  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchKPI();
  }, [id]);

  async function fetchKPI() {
    try {
      setLoading(true);
      const data = await kpisService.getById(id);

      if (!data) {
        setKpi(null);
        setLoading(false);
        return;
      }
      
      setKpi(data);
      setEditForm({
        name: data.name || '',
        category: data.category || '',
        target: data.target || '',
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
    setSaving(true);
    try {
      const updatedData = {
        name: editForm.name,
        category: editForm.category,
        target: parseFloat(editForm.target) || null,
        current_value: parseFloat(editForm.current_value) || null,
        description: editForm.description,
        measurement_method: editForm.measurement_method,
        frequency: editForm.frequency,
        data_source: editForm.data_source,
        calculation: editForm.calculation,
        remediation: editForm.remediation,
        notes: editForm.notes
      };

      await kpisService.update(id, updatedData);
      await fetchKPI();
      setEditing(false);
      alert('KPI updated successfully!');
    } catch (error) {
      console.error('Error updating KPI:', error);
      alert('Failed to update KPI: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  function getStatusInfo(current, target) {
    const curr = parseFloat(current) || 0;
    const tgt = parseFloat(target) || 100;
    const percentage = (curr / tgt) * 100;
    
    if (curr === 0) return { status: 'Not Started', color: '#64748b', bg: '#f1f5f9' };
    if (percentage >= 100) return { status: 'Achieved', color: '#10b981', bg: '#f0fdf4' };
    if (percentage >= 80) return { status: 'On Track', color: '#3b82f6', bg: '#eff6ff' };
    if (percentage >= 60) return { status: 'At Risk', color: '#f59e0b', bg: '#fffbeb' };
    return { status: 'Critical', color: '#ef4444', bg: '#fef2f2' };
  }

  if (loading) {
    return <LoadingSpinner message="Loading KPI details..." size="large" fullPage />;
  }

  if (!kpi) {
    return (
      <div className="page-container" data-testid="kpi-detail-not-found">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <AlertTriangle size={48} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
          <h2>KPI Not Found</h2>
          <p style={{ color: '#64748b' }}>The requested KPI could not be found.</p>
          <button className="btn btn-primary" onClick={() => navigate('/kpis')} style={{ marginTop: '1rem' }} data-testid="kpi-detail-back-button">
            <ArrowLeft size={16} /> Back to KPIs
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(kpi.current_value, kpi.target);
  
  // Use centralized permission check - Supplier PM and Admin can edit KPIs
  const canEdit = canManageKPIs;

  return (
    <div className="page-container" data-testid="kpi-detail-page">
      {/* Header */}
      <div className="page-header" data-testid="kpi-detail-header">
        <div className="page-title">
          <button 
            onClick={() => navigate('/kpis')} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '0.5rem' }}
            data-testid="kpi-detail-back-nav"
          >
            <ArrowLeft size={24} />
          </button>
          <TrendingUp size={28} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 data-testid="kpi-detail-ref">{kpi.kpi_ref}</h1>
              <span style={{ 
                padding: '0.25rem 0.75rem', 
                borderRadius: '9999px',
                fontSize: '0.85rem',
                fontWeight: '500',
                backgroundColor: statusInfo.bg,
                color: statusInfo.color
              }}>
                <span data-testid="kpi-detail-status">{statusInfo.status}</span>
              </span>
            </div>
            <p>{kpi.name}</p>
          </div>
        </div>
        {canEdit && !editing && (
          <button className="btn btn-primary" onClick={() => setEditing(true)} data-testid="kpi-detail-edit-button">
            <Edit2 size={18} /> Edit KPI Details
          </button>
        )}
        {editing && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              className="btn btn-primary" 
              onClick={handleSave}
              disabled={saving}
              data-testid="kpi-detail-save-button"
            >
              {saving ? <RefreshCw size={18} className="spin" /> : <Save size={18} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => {
                setEditing(false);
                // Reset form to original values
                setEditForm({
                  name: kpi.name || '',
                  category: kpi.category || '',
                  target: kpi.target || '',
                  current_value: kpi.current_value || '',
                  description: kpi.description || '',
                  measurement_method: kpi.measurement_method || '',
                  frequency: kpi.frequency || '',
                  data_source: kpi.data_source || '',
                  calculation: kpi.calculation || '',
                  remediation: kpi.remediation || '',
                  notes: kpi.notes || ''
                });
              }}
              disabled={saving}
              data-testid="kpi-detail-cancel-button"
            >
              <X size={18} /> Cancel
            </button>
          </div>
        )}
      </div>

      {/* Performance Summary */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }} data-testid="kpi-detail-stats">
        <div className="stat-card">
          <div className="stat-label">Target</div>
          <div className="stat-value" style={{ color: '#3b82f6' }} data-testid="kpi-detail-target">{kpi.target || '-'}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Current</div>
          <div className="stat-value" style={{ color: statusInfo.color }} data-testid="kpi-detail-current">
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
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Info size={20} /> Description
            </h3>
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
                {kpi.description || 'No description available.'}
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
                {kpi.measurement_method || 'Not specified.'}
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
                {kpi.calculation || 'Not specified.'}
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
                {kpi.remediation || 'Not specified.'}
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
                Category
              </label>
              {editing ? (
                <select
                  className="form-input"
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                >
                  <option value="">Select category</option>
                  <option value="Time Performance">Time Performance</option>
                  <option value="Quality of Collaboration">Quality of Collaboration</option>
                  <option value="Delivery Performance">Delivery Performance</option>
                </select>
              ) : (
                <div style={{ fontWeight: '500' }}>
                  {kpi.category || 'Not specified'}
                </div>
              )}
            </div>
            
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
                  <option value="Per Deliverable">Per Deliverable</option>
                  <option value="Annually">Annually</option>
                </select>
              ) : (
                <div style={{ fontWeight: '500' }}>
                  {kpi.frequency || 'Not specified'}
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
                  {kpi.data_source || 'Not specified'}
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
                  value={editForm.target}
                  onChange={(e) => setEditForm({ ...editForm, target: e.target.value })}
                  placeholder="Target %"
                  min="0"
                  max="100"
                />
              ) : (
                <div style={{ fontWeight: '500' }}>{kpi.target || '-'}%</div>
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
                  min="0"
                  max="100"
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

          {/* Permission Info */}
          {!canEdit && (
            <div className="card" style={{ marginTop: '1rem', backgroundColor: '#f1f5f9', borderLeft: '4px solid #64748b' }}>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>
                <Info size={14} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
                Only Supplier PM and Admin can edit KPIs.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
