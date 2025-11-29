import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Settings as SettingsIcon, Save, RefreshCw, AlertCircle, CheckCircle, DollarSign, Target, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { canAccessSettings } from '../lib/permissions';

export default function Settings() {
  const navigate = useNavigate();
  const { user, role: userRole } = useAuth();
  const { projectId, refreshProject } = useProject();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success', 'error', null
  
  // Project settings state
  const [settings, setSettings] = useState({
    name: '',
    reference: '',
    total_budget: 0,
    pmo_threshold: 15
  });
  const [originalSettings, setOriginalSettings] = useState(null);
  
  // Milestones for budget allocation
  const [milestones, setMilestones] = useState([]);
  const [savingMilestone, setSavingMilestone] = useState(null);

  // Fetch data when projectId is available
  useEffect(() => {
    if (projectId && userRole) {
      // Check permission
      if (!canAccessSettings(userRole)) {
        navigate('/dashboard');
        return;
      }
      fetchSettings();
    }
  }, [projectId, userRole]);

  async function fetchSettings() {
    try {
      // Fetch project details
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      
      if (projectError) throw projectError;
      
      if (project) {
        const settingsData = {
          name: project.name || '',
          reference: project.reference || '',
          total_budget: project.total_budget || 326829,
          pmo_threshold: project.pmo_threshold || 15
        };
        setSettings(settingsData);
        setOriginalSettings(settingsData);
      }

      // Fetch milestones for budget allocation
      const { data: milestonesData, error: milestonesError } = await supabase
        .from('milestones')
        .select('id, milestone_ref, name, budget')
        .eq('project_id', projectId)
        .order('milestone_ref');
      
      if (milestonesError) throw milestonesError;
      setMilestones(milestonesData || []);
      
    } catch (error) {
      console.error('Error fetching settings:', error);
      setSaveStatus('error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSettings() {
    setSaving(true);
    setSaveStatus(null);

    try {
      console.log('Saving settings:', { projectId, settings });
      
      const { data, error } = await supabase
        .from('projects')
        .update({
          name: settings.name,
          total_budget: parseFloat(settings.total_budget) || 0,
          pmo_threshold: parseInt(settings.pmo_threshold) || 15
        })
        .eq('id', projectId)
        .select();

      console.log('Save result:', { data, error });

      if (error) throw error;
      
      // Check if update actually happened (RLS might silently fail)
      if (!data || data.length === 0) {
        throw new Error('Update failed - no rows returned. This may be a permissions issue.');
      }

      setOriginalSettings({ ...settings });
      setSaveStatus('success');
      
      // Refresh project context so other pages get updated values
      if (refreshProject) refreshProject();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }

  async function handleMilestoneBudgetChange(milestoneId, newBudget) {
    setSavingMilestone(milestoneId);
    
    try {
      const { error } = await supabase
        .from('milestones')
        .update({ budget: parseFloat(newBudget) || 0 })
        .eq('id', milestoneId);

      if (error) throw error;

      // Update local state
      setMilestones(milestones.map(m => 
        m.id === milestoneId ? { ...m, budget: parseFloat(newBudget) || 0 } : m
      ));
    } catch (error) {
      console.error('Error updating milestone budget:', error);
      alert('Failed to update milestone budget: ' + error.message);
    } finally {
      setSavingMilestone(null);
    }
  }

  // Calculate budget allocation stats
  const totalAllocated = milestones.reduce((sum, m) => sum + (parseFloat(m.budget) || 0), 0);
  const unallocated = parseFloat(settings.total_budget) - totalAllocated;
  const allocationPercent = settings.total_budget > 0 
    ? Math.round((totalAllocated / settings.total_budget) * 100) 
    : 0;

  // Check if settings have changed
  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  // Loading state
  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '3rem' }}>
        <RefreshCw size={32} className="spin" style={{ color: 'var(--primary)' }} />
        <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading settings...</p>
      </div>
    );
  }

  // Permission check (backup - should redirect before this)
  if (!canAccessSettings(userRole)) {
    return (
      <div className="page-container">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
          <h2>Access Denied</h2>
          <p style={{ color: '#64748b' }}>You don't have permission to access project settings.</p>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Only Supplier PM and Admin can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="page-title">
          <SettingsIcon size={28} />
          <div>
            <h1>Project Settings</h1>
            <p>Configure project parameters and budget allocations</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {saveStatus === 'success' && (
            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckCircle size={18} /> Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <AlertCircle size={18} /> Error saving
            </span>
          )}
          <button 
            className="btn btn-primary" 
            onClick={handleSaveSettings}
            disabled={saving || !hasChanges}
            style={{ opacity: (!hasChanges || saving) ? 0.6 : 1 }}
          >
            {saving ? <RefreshCw size={18} className="spin" /> : <Save size={18} />}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {/* Project Information Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Target size={20} />
          Project Information
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Project Name</label>
            <input 
              className="form-input" 
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Project Reference</label>
            <input 
              className="form-input" 
              value={settings.reference}
              disabled
              style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
            />
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Reference cannot be changed</span>
          </div>
          <div className="form-group">
            <label className="form-label">Total Project Budget (£)</label>
            <input 
              className="form-input" 
              type="number"
              min="0"
              step="0.01"
              value={settings.total_budget}
              onChange={(e) => setSettings({ ...settings, total_budget: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">PMO Threshold (%)</label>
            <input 
              className="form-input" 
              type="number"
              min="0"
              max="100"
              value={settings.pmo_threshold}
              onChange={(e) => setSettings({ ...settings, pmo_threshold: e.target.value })}
            />
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Percentage of budget allocated to PMO overhead
            </span>
          </div>
        </div>
      </div>

      {/* Budget Allocation Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <DollarSign size={20} />
          Milestone Budget Allocation
        </h3>
        
        {/* Summary Stats */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '1rem', 
          marginBottom: '1.5rem',
          padding: '1rem',
          backgroundColor: '#f8fafc',
          borderRadius: '8px'
        }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Total Budget</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
              £{parseFloat(settings.total_budget).toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Allocated to Milestones</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3b82f6' }}>
              £{totalAllocated.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Unallocated</div>
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700', 
              color: unallocated < 0 ? '#ef4444' : unallocated > 0 ? '#f59e0b' : '#10b981' 
            }}>
              £{unallocated.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Allocation Progress</span>
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{allocationPercent}%</span>
          </div>
          <div style={{ 
            width: '100%', 
            height: '8px', 
            backgroundColor: '#e2e8f0', 
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${Math.min(allocationPercent, 100)}%`, 
              height: '100%', 
              backgroundColor: allocationPercent > 100 ? '#ef4444' : allocationPercent === 100 ? '#10b981' : '#3b82f6',
              borderRadius: '4px',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
          {allocationPercent > 100 && (
            <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <AlertCircle size={14} /> Budget over-allocated by £{Math.abs(unallocated).toLocaleString()}
            </div>
          )}
        </div>

        {/* Milestones Table */}
        {milestones.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Milestone</th>
                <th>Name</th>
                <th style={{ textAlign: 'right' }}>Billable Amount (£)</th>
                <th style={{ textAlign: 'right' }}>% of Total</th>
              </tr>
            </thead>
            <tbody>
              {milestones.map(m => (
                <tr key={m.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>{m.milestone_ref}</td>
                  <td>{m.name}</td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={m.budget || ''}
                        onChange={(e) => handleMilestoneBudgetChange(m.id, e.target.value)}
                        disabled={savingMilestone === m.id}
                        style={{ 
                          width: '120px', 
                          textAlign: 'right',
                          padding: '0.25rem 0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          opacity: savingMilestone === m.id ? 0.6 : 1
                        }}
                      />
                      {savingMilestone === m.id && (
                        <RefreshCw size={14} className="spin" style={{ color: '#3b82f6' }} />
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', color: '#64748b' }}>
                    {settings.total_budget > 0 
                      ? `${((m.budget || 0) / settings.total_budget * 100).toFixed(1)}%`
                      : '0%'
                    }
                  </td>
                </tr>
              ))}
              <tr style={{ fontWeight: '700', backgroundColor: '#f8fafc' }}>
                <td colSpan={2}>Total Allocated</td>
                <td style={{ textAlign: 'right' }}>£{totalAllocated.toLocaleString()}</td>
                <td style={{ textAlign: 'right' }}>{allocationPercent}%</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            <p>No milestones found. Create milestones on the Milestones page to allocate budgets.</p>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="card" style={{ backgroundColor: '#eff6ff', borderLeft: '4px solid #3b82f6' }}>
        <h4 style={{ marginBottom: '0.5rem', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Info size={18} />
          Settings Tips
        </h4>
        <ul style={{ margin: '0.5rem 0 0 1.5rem', color: '#1e40af', fontSize: '0.9rem' }}>
          <li>The <strong>Total Budget</strong> is used to calculate overall project progress on the Dashboard</li>
          <li><strong>Milestone billable amounts</strong> determine invoice values when milestones are completed and certificates are signed</li>
          <li>The <strong>PMO Threshold</strong> helps separate management costs from delivery costs on the Dashboard</li>
          <li>Milestone budget changes are saved automatically when you change the value</li>
          <li>Project name and budget changes require clicking "Save Settings"</li>
        </ul>
      </div>
    </div>
  );
}
