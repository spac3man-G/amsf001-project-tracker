/**
 * KPIs Page - Apple Design System
 * 
 * Track project performance against SOW targets
 * 
 * @version 2.0 - Apple Design System
 * @refactored 5 December 2025
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { kpisService } from '../services';
import { supabase } from '../lib/supabase';
import { 
  TrendingUp, RefreshCw, CheckCircle, AlertCircle, 
  AlertTriangle, Clock, Plus, X, Save, Info
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { usePermissions } from '../hooks/usePermissions';
import { LoadingSpinner, ConfirmDialog } from '../components/common';
import './KPIs.css';

export default function KPIs() {
  const navigate = useNavigate();
  const { user, role: userRole } = useAuth();
  const { projectId } = useProject();
  const currentUserId = user?.id || null;
  const { canManageKPIs } = usePermissions();

  const [kpis, setKpis] = useState([]);
  const [assessmentCounts, setAssessmentCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, kpi: null });

  const [newKPI, setNewKPI] = useState({
    kpi_ref: '',
    name: '',
    category: 'Time Performance',
    target: 90,
    description: '',
    measurement_method: '',
    frequency: 'Monthly',
    data_source: '',
    calculation: '',
    remediation: ''
  });

  const categories = ['Time Performance', 'Quality of Collaboration', 'Delivery Performance'];
  const frequencies = ['Monthly', 'Quarterly', 'Annually'];

  useEffect(() => {
    if (projectId) {
      fetchKPIs(projectId);
    }
  }, [projectId]);

  useEffect(() => {
    if (showAddForm && kpis.length > 0) {
      const maxRef = kpis.reduce((max, kpi) => {
        const num = parseInt(kpi.kpi_ref?.replace('KPI', '') || '0');
        return num > max ? num : max;
      }, 0);
      const nextRef = `KPI${String(maxRef + 1).padStart(2, '0')}`;
      setNewKPI(prev => ({ ...prev, kpi_ref: nextRef }));
    } else if (showAddForm) {
      setNewKPI(prev => ({ ...prev, kpi_ref: 'KPI01' }));
    }
  }, [showAddForm, kpis]);

  async function fetchKPIs(projId) {
    const pid = projId || projectId;
    if (!pid) return;

    try {
      const data = await kpisService.getAll(pid, {
        orderBy: { column: 'kpi_ref', ascending: true }
      });
      setKpis(data || []);

      const assessments = await kpisService.getAssessments(pid);
      const counts = {};
      if (assessments) {
        assessments.forEach(a => {
          if (!counts[a.kpi_id]) {
            counts[a.kpi_id] = { total: 0, met: 0, notMet: 0 };
          }
          counts[a.kpi_id].total++;
          if (a.criteria_met === true) counts[a.kpi_id].met++;
          if (a.criteria_met === false) counts[a.kpi_id].notMet++;
        });
      }
      setAssessmentCounts(counts);
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchKPIs();
  }

  async function handleAddKPI() {
    if (!newKPI.kpi_ref || !newKPI.name) {
      alert('Please fill in at least KPI Reference and Name');
      return;
    }

    const exists = kpis.some(k => k.kpi_ref.toLowerCase() === newKPI.kpi_ref.toLowerCase());
    if (exists) {
      alert(`KPI with reference "${newKPI.kpi_ref}" already exists.`);
      return;
    }

    setSaving(true);
    try {
      await kpisService.create({
        project_id: projectId,
        kpi_ref: newKPI.kpi_ref.toUpperCase(),
        name: newKPI.name,
        category: newKPI.category,
        target: parseInt(newKPI.target) || 90,
        unit: '%',
        description: newKPI.description || null,
        measurement_method: newKPI.measurement_method || null,
        frequency: newKPI.frequency || 'Monthly',
        data_source: newKPI.data_source || null,
        calculation: newKPI.calculation || null,
        remediation: newKPI.remediation || null,
        current_value: 0,
        created_by: currentUserId
      });

      await fetchKPIs();
      setShowAddForm(false);
      setNewKPI({
        kpi_ref: '', name: '', category: 'Time Performance', target: 90,
        description: '', measurement_method: '', frequency: 'Monthly',
        data_source: '', calculation: '', remediation: ''
      });
    } catch (error) {
      console.error('Error adding KPI:', error);
      alert('Failed to add KPI: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmDelete() {
    const kpi = deleteDialog.kpi;
    if (!kpi) return;

    setSaving(true);
    try {
      const assessments = assessmentCounts[kpi.id];
      if (assessments && assessments.total > 0) {
        await supabase.from('deliverable_kpi_assessments').delete().eq('kpi_id', kpi.id);
      }

      const { data: linkedDeliverables } = await supabase
        .from('deliverable_kpis').select('id').eq('kpi_id', kpi.id);
      if (linkedDeliverables && linkedDeliverables.length > 0) {
        await supabase.from('deliverable_kpis').delete().eq('kpi_id', kpi.id);
      }

      await kpisService.delete(kpi.id);
      await fetchKPIs();
      setDeleteDialog({ isOpen: false, kpi: null });
    } catch (error) {
      console.error('Error deleting KPI:', error);
      alert('Failed to delete KPI: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  function getKPIStatus(kpi) {
    const assessments = assessmentCounts[kpi.id];
    const target = kpi.target || 90;

    if (!assessments || assessments.total === 0) {
      return { label: 'Not Started', class: 'not-started', icon: Clock };
    }

    const percentage = Math.round((assessments.met / assessments.total) * 100);

    if (percentage >= target) {
      return { label: 'Achieved', class: 'achieved', icon: CheckCircle };
    } else if (percentage >= target * 0.8) {
      return { label: 'On Track', class: 'on-track', icon: TrendingUp };
    } else if (percentage >= target * 0.6) {
      return { label: 'At Risk', class: 'at-risk', icon: AlertTriangle };
    } else {
      return { label: 'Critical', class: 'critical', icon: AlertCircle };
    }
  }

  function getCategoryClass(category) {
    switch (category) {
      case 'Time Performance': return 'time';
      case 'Quality of Collaboration': return 'quality';
      case 'Delivery Performance': return 'delivery';
      default: return '';
    }
  }

  // Group KPIs by category
  const groupedKPIs = kpis.reduce((acc, kpi) => {
    const category = kpi.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(kpi);
    return acc;
  }, {});

  // Calculate stats
  const totalKPIs = kpis.length;
  const achievedKPIs = kpis.filter(k => getKPIStatus(k).label === 'Achieved').length;
  const atRiskKPIs = kpis.filter(k => {
    const status = getKPIStatus(k);
    return status.label === 'At Risk' || status.label === 'Critical';
  }).length;
  const notStartedKPIs = kpis.filter(k => getKPIStatus(k).label === 'Not Started').length;

  const canEdit = canManageKPIs;

  if (loading && !projectId) return <LoadingSpinner message="Loading KPIs..." size="large" fullPage />;

  return (
    <div className="kpis-page">
      {/* Header */}
      <header className="kpi-header">
        <div className="kpi-header-content">
          <div className="kpi-header-left">
            <h1>Key Performance Indicators</h1>
            <p>Track project performance against SOW targets</p>
          </div>
          <div className="kpi-header-actions">
            <button 
              className="kpi-btn kpi-btn-secondary" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw size={18} className={refreshing ? 'spinning' : ''} />
              Refresh
            </button>
            {canEdit && !showAddForm && (
              <button className="kpi-btn kpi-btn-primary" onClick={() => setShowAddForm(true)}>
                <Plus size={18} />
                Add KPI
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="kpi-content">
        {/* Summary Cards */}
        <div className="kpi-summary-grid">
          <div className="kpi-summary-card accent">
            <div className="kpi-summary-icon">
              <TrendingUp size={24} />
            </div>
            <div className="kpi-summary-value">{totalKPIs}</div>
            <div className="kpi-summary-label">Total KPIs</div>
          </div>
          
          <div className="kpi-summary-card success">
            <div className="kpi-summary-icon">
              <CheckCircle size={24} />
            </div>
            <div className="kpi-summary-value">{achievedKPIs}</div>
            <div className="kpi-summary-label">Achieved</div>
          </div>
          
          <div className="kpi-summary-card warning">
            <div className="kpi-summary-icon">
              <AlertTriangle size={24} />
            </div>
            <div className="kpi-summary-value">{atRiskKPIs}</div>
            <div className="kpi-summary-label">At Risk / Critical</div>
          </div>
          
          <div className="kpi-summary-card muted">
            <div className="kpi-summary-icon">
              <Clock size={24} />
            </div>
            <div className="kpi-summary-value">{notStartedKPIs}</div>
            <div className="kpi-summary-label">Not Started</div>
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && canEdit && (
          <div className="kpi-add-form">
            <div className="kpi-add-form-header">
              <h3 className="kpi-add-form-title">
                <Plus size={20} style={{ color: 'var(--ds-teal)' }} />
                Add New KPI
              </h3>
              <button className="kpi-add-form-close" onClick={() => setShowAddForm(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="kpi-form-row three-col">
              <div className="kpi-form-group">
                <label>KPI Reference *</label>
                <input
                  type="text"
                  value={newKPI.kpi_ref}
                  onChange={(e) => setNewKPI({ ...newKPI, kpi_ref: e.target.value.toUpperCase() })}
                  placeholder="KPI12"
                  style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: 600 }}
                />
              </div>
              <div className="kpi-form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={newKPI.name}
                  onChange={(e) => setNewKPI({ ...newKPI, name: e.target.value })}
                  placeholder="KPI name"
                />
              </div>
              <div className="kpi-form-group">
                <label>Category *</label>
                <select
                  value={newKPI.category}
                  onChange={(e) => setNewKPI({ ...newKPI, category: e.target.value })}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="kpi-form-row three-col">
              <div className="kpi-form-group">
                <label>Target (%)</label>
                <input
                  type="number"
                  value={newKPI.target}
                  onChange={(e) => setNewKPI({ ...newKPI, target: e.target.value })}
                  min="0"
                  max="100"
                />
              </div>
              <div className="kpi-form-group">
                <label>Frequency</label>
                <select
                  value={newKPI.frequency}
                  onChange={(e) => setNewKPI({ ...newKPI, frequency: e.target.value })}
                >
                  {frequencies.map(freq => (
                    <option key={freq} value={freq}>{freq}</option>
                  ))}
                </select>
              </div>
              <div className="kpi-form-group">
                <label>Data Source</label>
                <input
                  type="text"
                  value={newKPI.data_source}
                  onChange={(e) => setNewKPI({ ...newKPI, data_source: e.target.value })}
                  placeholder="e.g., Project Plan Records"
                />
              </div>
            </div>

            <div className="kpi-form-group" style={{ marginBottom: 16 }}>
              <label>Description</label>
              <textarea
                value={newKPI.description}
                onChange={(e) => setNewKPI({ ...newKPI, description: e.target.value })}
                placeholder="Describe what this KPI measures"
                rows={2}
              />
            </div>

            <div className="kpi-form-actions">
              <button className="kpi-btn kpi-btn-secondary" onClick={() => setShowAddForm(false)} disabled={saving}>
                Cancel
              </button>
              <button
                className="kpi-btn kpi-btn-primary"
                onClick={handleAddKPI}
                disabled={saving || !newKPI.kpi_ref || !newKPI.name}
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save KPI'}
              </button>
            </div>
          </div>
        )}

        {/* KPIs Table */}
        <div className="kpi-table-card">
          <div className="kpi-table-header">
            <h2 className="kpi-table-title">Key Performance Indicators</h2>
            <span className="kpi-table-count">{kpis.length} KPI{kpis.length !== 1 ? 's' : ''}</span>
          </div>
          
          {kpis.length === 0 ? (
            <div className="kpi-empty">
              <div className="kpi-empty-icon">
                <TrendingUp size={32} />
              </div>
              <div className="kpi-empty-title">No KPIs defined yet</div>
              <div className="kpi-empty-text">Click "Add KPI" to create your first KPI.</div>
            </div>
          ) : (
            <table className="kpi-table">
              <thead>
                <tr>
                  <th>KPI ID</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Target</th>
                  <th>Current</th>
                  <th>Assessments</th>
                </tr>
              </thead>
              <tbody>
                {kpis.map(kpi => {
                  const status = getKPIStatus(kpi);
                  const assessments = assessmentCounts[kpi.id];
                  const currentScore = assessments 
                    ? Math.round((assessments.met / assessments.total) * 100) 
                    : 0;

                  return (
                    <tr key={kpi.id} onClick={() => navigate(`/kpis/${kpi.id}`)}>
                      <td><span className="kpi-ref">{kpi.kpi_ref}</span></td>
                      <td><span className="kpi-name">{kpi.name}</span></td>
                      <td>
                        <span className={`kpi-category-badge ${getCategoryClass(kpi.category)}`}>
                          {kpi.category}
                        </span>
                      </td>
                      <td><span className="kpi-target">{kpi.target}%</span></td>
                      <td>
                        <span className={`kpi-current ${status.class}`}>{currentScore}%</span>
                      </td>
                      <td>
                        {assessments ? (
                          <span className="kpi-assessments">
                            {assessments.met}/{assessments.total} passed
                          </span>
                        ) : (
                          <span className="kpi-assessments-none">None yet</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Category Cards */}
        {Object.entries(groupedKPIs).map(([category, categoryKpis]) => (
          <div key={category} className="kpi-category-section">
            <div className="kpi-category-header">
              <span className={`kpi-category-dot ${getCategoryClass(category)}`}></span>
              <h3 className="kpi-category-title">{category}</h3>
            </div>
            <div className="kpi-cards-grid">
              {categoryKpis.map(kpi => {
                const status = getKPIStatus(kpi);
                const assessments = assessmentCounts[kpi.id];
                const StatusIcon = status.icon;
                const currentScore = assessments 
                  ? Math.round((assessments.met / assessments.total) * 100) 
                  : 0;
                
                return (
                  <Link key={kpi.id} to={`/kpis/${kpi.id}`} className="kpi-card">
                    <div className="kpi-card-header">
                      <span className="kpi-card-ref">{kpi.kpi_ref}</span>
                      <span className={`kpi-card-status ${status.class}`}>
                        <StatusIcon size={14} />
                      </span>
                    </div>
                    <div className={`kpi-card-score ${status.class}`}>{currentScore}%</div>
                    <div className="kpi-card-target">Target: {kpi.target}%</div>
                    <div className="kpi-card-progress">
                      <div 
                        className={`kpi-card-progress-bar ${status.class}`}
                        style={{ width: `${Math.min(currentScore / kpi.target * 100, 100)}%` }}
                      ></div>
                    </div>
                    <div className="kpi-card-name">{kpi.name}</div>
                    <div className="kpi-card-assessments">
                      {assessments && assessments.total > 0 
                        ? `${assessments.met} of ${assessments.total} assessments passed`
                        : 'No assessments yet'}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Info Box */}
        <div className="kpi-info-box">
          <div className="kpi-info-header">
            <Info size={18} />
            How KPI Scores Work
          </div>
          <ul className="kpi-info-list">
            <li><strong>Not Started</strong> — No deliverables with this KPI have been assessed yet</li>
            <li><strong>Achieved</strong> — Current score meets or exceeds target</li>
            <li><strong>On Track</strong> — Within 80% of target</li>
            <li><strong>At Risk</strong> — Between 60-80% of target</li>
            <li><strong>Critical</strong> — Below 60% of target</li>
            <li>Click any row to view details and manage assessments</li>
          </ul>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, kpi: null })}
        onConfirm={handleConfirmDelete}
        title="Delete KPI?"
        message={deleteDialog.kpi ? `This will permanently delete "${deleteDialog.kpi.kpi_ref}: ${deleteDialog.kpi.name}". This action cannot be undone.` : ''}
        confirmText="Delete KPI"
        cancelText="Cancel"
        type="danger"
        isLoading={saving}
      />
    </div>
  );
}
