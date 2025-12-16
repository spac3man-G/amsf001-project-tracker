/**
 * Quality Standards Page - Apple Design System (Clean)
 * 
 * @version 2.1 - Removed summary cards
 * @updated 5 December 2025
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { qualityStandardsService } from '../services';
import { supabase } from '../lib/supabase';
import { Award, CheckCircle, AlertCircle, Clock, TrendingUp, AlertTriangle, Info, Plus, Save, X, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { usePermissions } from '../hooks/usePermissions';
import { LoadingSpinner, ConfirmDialog } from '../components/common';
import './QualityStandards.css';

export default function QualityStandards() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projectId } = useProject();
  const currentUserId = user?.id || null;
  const { canManageQualityStandards } = usePermissions();
  const canEdit = canManageQualityStandards;

  const [qualityStandards, setQualityStandards] = useState([]);
  const [assessmentCounts, setAssessmentCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, qs: null });
  const [saving, setSaving] = useState(false);
  
  const [newQS, setNewQS] = useState({ qs_ref: '', name: '', description: '', target: 100, current_value: 0 });

  useEffect(() => { if (projectId) fetchQualityStandards(projectId); }, [projectId]);

  async function fetchQualityStandards(projId) {
    const pid = projId || projectId;
    if (!pid) return;
    try {
      const data = await qualityStandardsService.getAll(pid, { orderBy: { column: 'qs_ref', ascending: true } });
      setQualityStandards(data || []);
      const assessments = await qualityStandardsService.getAssessments(pid);
      const counts = {};
      if (assessments && assessments.length > 0) {
        assessments.forEach(a => {
          const qsId = a.quality_standard_id;
          if (!counts[qsId]) counts[qsId] = { total: 0, met: 0 };
          if (a.criteria_met !== null) { counts[qsId].total++; if (a.criteria_met === true) counts[qsId].met++; }
        });
      }
      setAssessmentCounts(counts);
    } catch (error) { console.error('Error fetching quality standards:', error); }
    finally { setLoading(false); setRefreshing(false); }
  }

  async function handleRefresh() { setRefreshing(true); await fetchQualityStandards(); }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newQS.qs_ref || !newQS.name) { alert('Please fill in Reference and Name'); return; }
    setSaving(true);
    try {
      await qualityStandardsService.create({
        project_id: projectId, qs_ref: newQS.qs_ref, name: newQS.name, description: newQS.description,
        target: parseInt(newQS.target) || 100, current_value: parseInt(newQS.current_value) || 0, created_by: currentUserId
      });
      await fetchQualityStandards();
      setShowAddForm(false);
      setNewQS({ qs_ref: '', name: '', description: '', target: 100, current_value: 0 });
    } catch (error) { alert('Failed to add: ' + error.message); }
    finally { setSaving(false); }
  }

  async function handleConfirmDelete() {
    const qs = deleteDialog.qs;
    if (!qs) return;
    setSaving(true);
    try {
      await supabase.from('deliverable_qs_assessments').delete().eq('quality_standard_id', qs.id);
      await qualityStandardsService.delete(qs.id);
      await fetchQualityStandards();
      setDeleteDialog({ isOpen: false, qs: null });
    } catch (error) { alert('Failed to delete: ' + error.message); }
    finally { setSaving(false); }
  }

  function getQSStatus(qs) {
    const assessments = assessmentCounts[qs.id] || { total: 0, met: 0 };
    if (assessments.total === 0) return { label: 'Not Started', class: 'not-started', icon: Clock };
    const percentage = (assessments.met / assessments.total) * 100;
    const target = qs.target || 100;
    if (percentage >= target) return { label: 'Achieved', class: 'achieved', icon: CheckCircle };
    if (percentage >= target * 0.8) return { label: 'On Track', class: 'on-track', icon: TrendingUp };
    if (percentage >= target * 0.6) return { label: 'At Risk', class: 'at-risk', icon: AlertTriangle };
    return { label: 'Critical', class: 'critical', icon: AlertCircle };
  }

  if (loading && !projectId) return <LoadingSpinner message="Loading quality standards..." size="large" fullPage />;

  return (
    <div className="qs-page" data-testid="quality-standards-page">
      <header className="qs-header" data-testid="quality-standards-header">
        <div className="qs-header-content">
          <div className="qs-header-left">
            <h1 data-testid="quality-standards-title">Quality Standards</h1>
            <p>Track quality compliance across deliverables</p>
          </div>
          <div className="qs-header-actions">
            <button className="qs-btn qs-btn-secondary" onClick={handleRefresh} disabled={refreshing} data-testid="quality-standards-refresh-button">
              <RefreshCw size={18} className={refreshing ? 'spinning' : ''} /> Refresh
            </button>
            {canEdit && !showAddForm && (
              <button className="qs-btn qs-btn-primary" onClick={() => setShowAddForm(true)} data-testid="add-quality-standard-button">
                <Plus size={18} /> Add Quality Standard
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="qs-content" data-testid="quality-standards-content">
        {showAddForm && canEdit && (
          <div className="qs-add-form" data-testid="quality-standards-add-form">
            <div className="qs-add-form-header">
              <h3 className="qs-add-form-title"><Plus size={20} style={{ color: 'var(--ds-teal)' }} /> Add New Quality Standard</h3>
              <button className="qs-add-form-close" onClick={() => setShowAddForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd}>
              <div className="qs-form-row two-col">
                <div className="qs-form-group"><label>Reference *</label><input type="text" value={newQS.qs_ref} onChange={(e) => setNewQS({ ...newQS, qs_ref: e.target.value })} placeholder="e.g., QS09" style={{ fontFamily: 'var(--ds-font-mono)', fontWeight: 600 }} required data-testid="qs-ref-input" /></div>
                <div className="qs-form-group"><label>Name *</label><input type="text" value={newQS.name} onChange={(e) => setNewQS({ ...newQS, name: e.target.value })} placeholder="e.g., Documentation Quality" required data-testid="qs-name-input" /></div>
              </div>
              <div className="qs-form-group" style={{ marginBottom: 16 }}><label>Description</label><textarea value={newQS.description} onChange={(e) => setNewQS({ ...newQS, description: e.target.value })} placeholder="Describe what this quality standard measures..." rows={3} data-testid="qs-description-input" /></div>
              <div className="qs-form-row targets">
                <div className="qs-form-group"><label>Target (%)</label><input type="number" min="0" max="100" value={newQS.target} onChange={(e) => setNewQS({ ...newQS, target: e.target.value })} data-testid="qs-target-input" /></div>
                <div className="qs-form-group"><label>Current Value (%)</label><input type="number" min="0" max="100" value={newQS.current_value} onChange={(e) => setNewQS({ ...newQS, current_value: e.target.value })} /></div>
              </div>
              <div className="qs-form-actions">
                <button type="button" className="qs-btn qs-btn-secondary" onClick={() => setShowAddForm(false)} data-testid="qs-cancel-button">Cancel</button>
                <button type="submit" className="qs-btn qs-btn-primary" disabled={saving} data-testid="qs-save-button"><Save size={16} /> {saving ? 'Saving...' : 'Save Quality Standard'}</button>
              </div>
            </form>
          </div>
        )}

        <div className="qs-table-card" data-testid="quality-standards-table-card">
          <div className="qs-table-header">
            <h2 className="qs-table-title">Quality Standards</h2>
            <span className="qs-table-count" data-testid="quality-standards-count">{qualityStandards.length} standard{qualityStandards.length !== 1 ? 's' : ''}</span>
          </div>
          
          {qualityStandards.length === 0 ? (
            <div className="qs-empty" data-testid="quality-standards-empty-state">
              <div className="qs-empty-icon"><Award size={32} /></div>
              <div className="qs-empty-title">No quality standards found</div>
              <div className="qs-empty-text">{canEdit ? 'Click "Add Quality Standard" to create one.' : 'No quality standards have been defined yet.'}</div>
            </div>
          ) : (
            <table className="qs-table" data-testid="quality-standards-table">
              <thead><tr><th>Ref</th><th>Name</th><th>Target</th><th>Current</th><th>Assessments</th></tr></thead>
              <tbody>
                {qualityStandards.map(qs => {
                  const status = getQSStatus(qs);
                  const assessments = assessmentCounts[qs.id] || { total: 0, met: 0 };
                  const currentPercent = assessments.total > 0 ? Math.round((assessments.met / assessments.total) * 100) : qs.current_value || 0;
                  return (
                    <tr key={qs.id} onClick={() => navigate(`/quality-standards/${qs.id}`)} data-testid={`qs-row-${qs.id}`}>
                      <td><span className="qs-ref">{qs.qs_ref}</span></td>
                      <td><span className="qs-name">{qs.name}</span></td>
                      <td><span className="qs-target">{qs.target}%</span></td>
                      <td><span className={`qs-current ${status.class}`}>{currentPercent}%</span></td>
                      <td>{assessments.total > 0 ? <span className="qs-assessments">{assessments.met} of {assessments.total} passed</span> : <span className="qs-assessments-none">None yet</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="qs-info-box">
          <div className="qs-info-header"><Info size={18} /> Quality Standards Overview</div>
          <ul className="qs-info-list">
            <li><strong>Not Started</strong> — No deliverables have been assessed against this standard yet</li>
            <li><strong>Achieved</strong> — Current score meets or exceeds target</li>
            <li><strong>On Track</strong> — Within 80% of target</li>
            <li><strong>At Risk</strong> — 60-80% of target</li>
            <li><strong>Critical</strong> — Below 60% of target</li>
            <li>Click any row to view details and manage assessments</li>
          </ul>
        </div>
      </div>

      <ConfirmDialog isOpen={deleteDialog.isOpen} onClose={() => setDeleteDialog({ isOpen: false, qs: null })} onConfirm={handleConfirmDelete} title="Delete Quality Standard?" message={deleteDialog.qs ? `This will permanently delete "${deleteDialog.qs.qs_ref}: ${deleteDialog.qs.name}".` : ''} confirmText="Delete" cancelText="Cancel" type="danger" isLoading={saving} />
    </div>
  );
}
