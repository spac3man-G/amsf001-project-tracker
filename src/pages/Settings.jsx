import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Settings as SettingsIcon, Save, AlertCircle, CheckCircle, RefreshCw, Lock } from 'lucide-react';
import { canAccessSettings } from '../utils/permissions';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState('viewer');
  const [hasAccess, setHasAccess] = useState(false);
  const [project, setProject] = useState(null);
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    reference: '',
    total_budget: '',
    expenses_budget: '',
    allocated_days: '',
    start_date: '',
    end_date: '',
    pmo_threshold: '',
    expenses_notes: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    try {
      // Get current user and role
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role);
          setHasAccess(canAccessSettings(profile.role));
        }
      }

      // Get project data
      const { data: projectData, error } = await supabase
        .from('projects')
        .select('*')
        .eq('reference', 'AMSF001')
        .single();

      if (error) throw error;

      if (projectData) {
        setProject(projectData);
        setFormData({
          name: projectData.name || '',
          reference: projectData.reference || '',
          total_budget: projectData.total_budget || '',
          expenses_budget: projectData.expenses_budget || '',
          allocated_days: projectData.allocated_days || '',
          start_date: projectData.start_date || '',
          end_date: projectData.end_date || '',
          pmo_threshold: projectData.pmo_threshold || '15',
          expenses_notes: projectData.expenses_notes || ''
        });
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
      setSaveMessage({ type: 'error', text: 'Failed to load project settings' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    
    if (!hasAccess) {
      setSaveMessage({ type: 'error', text: 'You do not have permission to save settings' });
      return;
    }

    setSaving(true);
    setSaveMessage({ type: '', text: '' });

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: formData.name,
          total_budget: parseFloat(formData.total_budget) || 0,
          expenses_budget: parseFloat(formData.expenses_budget) || 0,
          allocated_days: parseInt(formData.allocated_days) || 0,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          pmo_threshold: parseFloat(formData.pmo_threshold) || 15,
          expenses_notes: formData.expenses_notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', project.id);

      if (error) throw error;

      setSaveMessage({ type: 'success', text: 'Settings saved successfully!' });
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save settings: ' + error.message });
    } finally {
      setSaving(false);
    }
  }

  function handleChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  function handleReset() {
    if (project) {
      setFormData({
        name: project.name || '',
        reference: project.reference || '',
        total_budget: project.total_budget || '',
        expenses_budget: project.expenses_budget || '',
        allocated_days: project.allocated_days || '',
        start_date: project.start_date || '',
        end_date: project.end_date || '',
        pmo_threshold: project.pmo_threshold || '15',
        expenses_notes: project.expenses_notes || ''
      });
      setSaveMessage({ type: '', text: '' });
    }
  }

  // Calculate derived values
  const pmoAllocation = formData.total_budget && formData.pmo_threshold 
    ? (parseFloat(formData.total_budget) * parseFloat(formData.pmo_threshold) / 100).toFixed(2)
    : '0.00';
  
  const nonPmoAllocation = formData.total_budget && formData.pmo_threshold
    ? (parseFloat(formData.total_budget) * (100 - parseFloat(formData.pmo_threshold)) / 100).toFixed(2)
    : '0.00';

  if (loading) {
    return <div className="loading">Loading settings...</div>;
  }

  // Access denied view
  if (!hasAccess) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div className="page-title">
            <SettingsIcon size={28} />
            <div>
              <h1>Project Settings</h1>
              <p>Configure project parameters and budgets</p>
            </div>
          </div>
        </div>

        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Lock size={48} style={{ color: '#9ca3af', marginBottom: '1rem' }} />
          <h3 style={{ color: '#6b7280', marginBottom: '0.5rem' }}>Access Restricted</h3>
          <p style={{ color: '#9ca3af' }}>
            Only Supplier PM and Admin users can access project settings.
          </p>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginTop: '1rem' }}>
            Your current role: <strong style={{ textTransform: 'capitalize' }}>{userRole.replace('_', ' ')}</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title">
          <SettingsIcon size={28} />
          <div>
            <h1>Project Settings</h1>
            <p>Configure project parameters and budgets</p>
          </div>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage.text && (
        <div 
          className="card" 
          style={{ 
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: saveMessage.type === 'success' ? '#f0fdf4' : '#fef2f2',
            borderLeft: `4px solid ${saveMessage.type === 'success' ? '#22c55e' : '#ef4444'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}
        >
          {saveMessage.type === 'success' ? (
            <CheckCircle size={20} style={{ color: '#22c55e' }} />
          ) : (
            <AlertCircle size={20} style={{ color: '#ef4444' }} />
          )}
          <span style={{ color: saveMessage.type === 'success' ? '#166534' : '#dc2626' }}>
            {saveMessage.text}
          </span>
        </div>
      )}

      <form onSubmit={handleSave}>
        {/* Project Information */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SettingsIcon size={20} />
            Project Information
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label className="form-label">Project Name</label>
              <input 
                type="text"
                className="form-input" 
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Enter project name"
              />
            </div>
            <div>
              <label className="form-label">Project Reference</label>
              <input 
                type="text"
                className="form-input" 
                value={formData.reference}
                disabled
                style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Reference cannot be changed</span>
            </div>
            <div>
              <label className="form-label">Start Date</label>
              <input 
                type="date"
                className="form-input" 
                value={formData.start_date}
                onChange={(e) => handleChange('start_date', e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">End Date</label>
              <input 
                type="date"
                className="form-input" 
                value={formData.end_date}
                onChange={(e) => handleChange('end_date', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Budget Settings */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>💰 Budget Settings</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <label className="form-label">Total Project Budget (£)</label>
              <input 
                type="number"
                step="0.01"
                min="0"
                className="form-input" 
                value={formData.total_budget}
                onChange={(e) => handleChange('total_budget', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="form-label">Expenses Budget (£)</label>
              <input 
                type="number"
                step="0.01"
                min="0"
                className="form-input" 
                value={formData.expenses_budget}
                onChange={(e) => handleChange('expenses_budget', e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="form-label">Allocated Days</label>
              <input 
                type="number"
                min="0"
                className="form-input" 
                value={formData.allocated_days}
                onChange={(e) => handleChange('allocated_days', e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="form-label">PMO Threshold (%)</label>
              <input 
                type="number"
                min="0"
                max="100"
                step="0.1"
                className="form-input" 
                value={formData.pmo_threshold}
                onChange={(e) => handleChange('pmo_threshold', e.target.value)}
                placeholder="15"
              />
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Percentage of budget allocated to PMO activities
              </span>
            </div>
          </div>

          {/* Budget Breakdown Preview */}
          {formData.total_budget && (
            <div style={{ 
              marginTop: '1.5rem', 
              padding: '1rem', 
              backgroundColor: '#f8fafc', 
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#64748b' }}>Budget Breakdown Preview</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Budget</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b' }}>
                    £{parseFloat(formData.total_budget || 0).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>PMO Allocation ({formData.pmo_threshold}%)</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#7c3aed' }}>
                    £{parseFloat(pmoAllocation).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Non-PMO Allocation ({100 - parseFloat(formData.pmo_threshold || 0)}%)</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#3b82f6' }}>
                    £{parseFloat(nonPmoAllocation).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>📝 Notes</h3>
          <div>
            <label className="form-label">Expenses Notes</label>
            <textarea 
              className="form-input"
              rows={3}
              value={formData.expenses_notes}
              onChange={(e) => handleChange('expenses_notes', e.target.value)}
              placeholder="Add any notes about expenses policy, approval requirements, etc."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            type="button"
            className="btn btn-secondary"
            onClick={handleReset}
            disabled={saving}
          >
            <RefreshCw size={16} />
            Reset Changes
          </button>
          <button 
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? (
              <>
                <RefreshCw size={16} className="spinning" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Settings
              </>
            )}
          </button>
        </div>
      </form>

      {/* Info Box */}
      <div className="card" style={{ marginTop: '1.5rem', backgroundColor: '#eff6ff', borderLeft: '4px solid #3b82f6' }}>
        <h4 style={{ marginBottom: '0.5rem', color: '#1e40af' }}>ℹ️ About Project Settings</h4>
        <ul style={{ margin: '0.5rem 0 0 1.5rem', color: '#1e40af', fontSize: '0.9rem' }}>
          <li><strong>Total Budget:</strong> The overall contract value for the project</li>
          <li><strong>Expenses Budget:</strong> Allocated budget specifically for travel, accommodation, and sustenance</li>
          <li><strong>PMO Threshold:</strong> Percentage of budget allocated to Project Management Office activities</li>
          <li><strong>Allocated Days:</strong> Total number of resource days budgeted for the project</li>
          <li>Changes are saved to the database and will affect budget tracking across all pages</li>
        </ul>
      </div>
    </div>
  );
}
