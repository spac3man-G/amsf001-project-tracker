/**
 * RAID Add Form - Apple Design System
 * 
 * Create new RAID (Risk, Assumption, Issue, Dependency) items.
 * Clean modal form with category selection cards.
 * 
 * @version 2.0
 * @updated 5 December 2025
 */

import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, AlertCircle, Info, Link2 } from 'lucide-react';
import { raidService } from '../../services';
import { supabase } from '../../lib/supabase';
import './RaidAddForm.css';

const CATEGORIES = [
  { value: 'Risk', icon: AlertTriangle, className: 'cat-risk' },
  { value: 'Assumption', icon: Info, className: 'cat-assumption' },
  { value: 'Issue', icon: AlertCircle, className: 'cat-issue' },
  { value: 'Dependency', icon: Link2, className: 'cat-dependency' }
];

export default function RaidAddForm({ projectId, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [milestones, setMilestones] = useState([]);
  
  const [formData, setFormData] = useState({
    category: 'Risk',
    raid_ref: '',
    title: '',
    description: '',
    impact: '',
    probability: 'Medium',
    severity: 'Medium',
    mitigation: '',
    status: 'Open',
    owner_user_id: '',
    milestone_id: '',
    due_date: '',
    source: ''
  });

  // Fetch team members and milestones for dropdowns
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch team members (all users with project access)
        const { data: userProjectsData, error: upError } = await supabase
          .from('user_projects')
          .select(`
            user_id,
            role,
            profiles:user_id(id, full_name, email)
          `)
          .eq('project_id', projectId);
        
        if (upError) {
          console.error('Error fetching team members:', upError);
        }
        
        // Transform to flat list with name for display
        const members = (userProjectsData || [])
          .filter(up => up.profiles) // Ensure profile exists
          .map(up => ({
            id: up.profiles.id,
            name: up.profiles.full_name || up.profiles.email,
            email: up.profiles.email,
            role: up.role
          }))
          .sort((a, b) => a.name.localeCompare(b.name));
        
        // Fetch milestones
        const { data: milestonesData } = await supabase
          .from('milestones')
          .select('id, name, milestone_ref')
          .eq('project_id', projectId)
          .or('is_deleted.is.null,is_deleted.eq.false')
          .order('milestone_ref');
        
        setTeamMembers(members);
        setMilestones(milestonesData || []);
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      }
    }
    
    if (projectId) fetchData();
  }, [projectId]);

  // Auto-generate reference when category changes
  useEffect(() => {
    async function generateRef() {
      try {
        const nextRef = await raidService.getNextRef(projectId, formData.category);
        setFormData(prev => ({ ...prev, raid_ref: nextRef }));
      } catch (error) {
        console.error('Error generating ref:', error);
      }
    }
    
    if (projectId && formData.category) generateRef();
  }, [projectId, formData.category]);

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      alert('Please enter a description');
      return;
    }

    setSaving(true);
    try {
      await raidService.create({
        project_id: projectId,
        raid_ref: formData.raid_ref,
        category: formData.category,
        title: formData.title || null,
        description: formData.description,
        impact: formData.impact || null,
        probability: formData.probability || null,
        severity: formData.severity || null,
        mitigation: formData.mitigation || null,
        status: formData.status,
        owner_user_id: formData.owner_user_id || null,
        milestone_id: formData.milestone_id || null,
        due_date: formData.due_date || null,
        source: formData.source || null,
        raised_date: new Date().toISOString().split('T')[0]
      });
      
      onSaved();
    } catch (error) {
      console.error('Error creating RAID item:', error);
      alert('Failed to create item. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  const selectedCategory = CATEGORIES.find(c => c.value === formData.category);

  return (
    <div className="raid-add-overlay" onClick={onClose}>
      <div className="raid-add-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <header className={`raid-add-header ${selectedCategory?.className || ''}`}>
          <div className="raid-add-header-content">
            <div className="raid-add-icon">
              {selectedCategory && <selectedCategory.icon size={22} />}
            </div>
            <div>
              <h2>New {formData.category}</h2>
              <span className="raid-add-ref">{formData.raid_ref}</span>
            </div>
          </div>
          <button className="raid-add-close" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        {/* Form */}
        <form onSubmit={handleSubmit} className="raid-add-body">
          {/* Category Selection */}
          <div className="raid-form-section">
            <label className="raid-form-label">Category</label>
            <div className="raid-category-grid">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isSelected = formData.category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => handleChange('category', cat.value)}
                    className={`raid-category-card ${cat.className} ${isSelected ? 'selected' : ''}`}
                  >
                    <Icon size={20} />
                    <span>{cat.value}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div className="raid-form-group">
            <label className="raid-form-label">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Short title for quick identification"
              className="raid-form-input"
            />
          </div>

          {/* Description */}
          <div className="raid-form-group">
            <label className="raid-form-label">Description <span className="required">*</span></label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              placeholder="Detailed description of the item"
              className="raid-form-textarea"
              required
            />
          </div>

          {/* Impact */}
          <div className="raid-form-group">
            <label className="raid-form-label">Impact</label>
            <textarea
              value={formData.impact}
              onChange={(e) => handleChange('impact', e.target.value)}
              rows={2}
              placeholder="What is the impact if this materialises?"
              className="raid-form-textarea"
            />
          </div>

          {/* Probability & Severity Row */}
          <div className="raid-form-row">
            <div className="raid-form-group">
              <label className="raid-form-label">Probability</label>
              <select
                value={formData.probability}
                onChange={(e) => handleChange('probability', e.target.value)}
                className="raid-form-select"
              >
                <option value="">Select...</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div className="raid-form-group">
              <label className="raid-form-label">Severity</label>
              <select
                value={formData.severity}
                onChange={(e) => handleChange('severity', e.target.value)}
                className="raid-form-select"
              >
                <option value="">Select...</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          {/* Mitigation */}
          <div className="raid-form-group">
            <label className="raid-form-label">Mitigation / Action Plan</label>
            <textarea
              value={formData.mitigation}
              onChange={(e) => handleChange('mitigation', e.target.value)}
              rows={2}
              placeholder="Actions to mitigate or address this item"
              className="raid-form-textarea"
            />
          </div>

          {/* Owner & Due Date Row */}
          <div className="raid-form-row">
            <div className="raid-form-group">
              <label className="raid-form-label">Owner</label>
              <select
                value={formData.owner_user_id}
                onChange={(e) => handleChange('owner_user_id', e.target.value)}
                className="raid-form-select"
              >
                <option value="">Select owner...</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name}{m.role ? ` (${m.role.replace('_', ' ')})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="raid-form-group">
              <label className="raid-form-label">Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => handleChange('due_date', e.target.value)}
                className="raid-form-input"
              />
            </div>
          </div>

          {/* Linked Milestone */}
          <div className="raid-form-group">
            <label className="raid-form-label">Linked Milestone</label>
            <select
              value={formData.milestone_id}
              onChange={(e) => handleChange('milestone_id', e.target.value)}
              className="raid-form-select"
            >
              <option value="">No linked milestone</option>
              {milestones.map(m => (
                <option key={m.id} value={m.id}>
                  {m.milestone_ref} - {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Source */}
          <div className="raid-form-group">
            <label className="raid-form-label">Source</label>
            <input
              type="text"
              value={formData.source}
              onChange={(e) => handleChange('source', e.target.value)}
              placeholder="e.g., Project Meeting, SoW v2.61"
              className="raid-form-input"
            />
          </div>
        </form>

        {/* Footer */}
        <footer className="raid-add-footer">
          <button type="button" onClick={onClose} className="raid-btn raid-btn-secondary">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !formData.description.trim()}
            className="raid-btn raid-btn-primary"
          >
            <Save size={16} />
            {saving ? 'Creating...' : 'Create Item'}
          </button>
        </footer>
      </div>
    </div>
  );
}
