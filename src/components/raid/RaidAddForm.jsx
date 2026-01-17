/**
 * RAID Add Form - Apple Design System
 *
 * Create new RAID (Risk, Assumption, Issue, Dependency) items.
 * Clean modal form with category selection cards.
 * Includes AI-powered categorization suggestions.
 *
 * @version 2.1
 * @updated 17 January 2026
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, AlertTriangle, AlertCircle, Info, Link2, Sparkles, Loader2, Check } from 'lucide-react';
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

  // AI suggestion state
  const [aiSuggesting, setAiSuggesting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [aiError, setAiError] = useState(null);
  const [suggestionApplied, setSuggestionApplied] = useState(false);

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
        // First get the user_projects for this project
        const { data: userProjectsData, error: upError } = await supabase
          .from('user_projects')
          .select('user_id, role')
          .eq('project_id', projectId);
        
        if (upError) {
          console.error('Error fetching user_projects:', upError);
        }
        
        let members = [];
        if (userProjectsData && userProjectsData.length > 0) {
          // Get the user IDs
          const userIds = userProjectsData.map(up => up.user_id);
          
          // Fetch profiles for these users
          const { data: profilesData, error: profError } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', userIds);
          
          if (profError) {
            console.error('Error fetching profiles:', profError);
          }
          
          // Merge the data
          members = userProjectsData
            .map(up => {
              const profile = (profilesData || []).find(p => p.id === up.user_id);
              if (!profile) return null;
              return {
                id: profile.id,
                name: profile.full_name || profile.email,
                email: profile.email,
                role: up.role
              };
            })
            .filter(Boolean)
            .sort((a, b) => a.name.localeCompare(b.name));
        }
        
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

  // AI Categorization suggestion
  const handleAiSuggest = useCallback(async () => {
    const text = `${formData.title} ${formData.description}`.trim();
    if (text.length < 10) {
      setAiError('Please enter more detail in the title or description first');
      return;
    }

    setAiSuggesting(true);
    setAiError(null);
    setAiSuggestion(null);
    setSuggestionApplied(false);

    try {
      const response = await fetch('/api/ai-raid-categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          projectId,
          includeRelated: true
        })
      });

      if (!response.ok) {
        throw new Error('AI service unavailable');
      }

      const data = await response.json();
      if (data.success && data.suggestion) {
        setAiSuggestion(data.suggestion);
      } else {
        throw new Error(data.error || 'No suggestion returned');
      }
    } catch (error) {
      console.error('AI suggestion error:', error);
      setAiError(error.message || 'Failed to get AI suggestion');
    } finally {
      setAiSuggesting(false);
    }
  }, [formData.title, formData.description, projectId]);

  // Apply AI suggestion to form
  const handleApplySuggestion = useCallback(() => {
    if (!aiSuggestion) return;

    setFormData(prev => ({
      ...prev,
      category: aiSuggestion.category || prev.category,
      severity: aiSuggestion.severity || prev.severity,
      probability: aiSuggestion.probability || prev.probability,
      title: aiSuggestion.suggestedTitle || prev.title,
      mitigation: aiSuggestion.mitigationSuggestions?.length > 0
        ? aiSuggestion.mitigationSuggestions.join('\n')
        : prev.mitigation
    }));
    setSuggestionApplied(true);
  }, [aiSuggestion]);

  // Clear suggestion when description changes significantly
  useEffect(() => {
    if (aiSuggestion && !suggestionApplied) {
      // Clear stale suggestion if user modifies text after getting a suggestion
      setAiSuggestion(null);
    }
  }, [formData.description]);

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

          {/* AI Suggestion Section */}
          <div className="raid-ai-section">
            <button
              type="button"
              onClick={handleAiSuggest}
              disabled={aiSuggesting || (formData.title + formData.description).trim().length < 10}
              className="raid-ai-suggest-btn"
            >
              {aiSuggesting ? (
                <>
                  <Loader2 size={16} className="spin" />
                  Analysing...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  AI Suggest Category
                </>
              )}
            </button>

            {aiError && (
              <div className="raid-ai-error">
                <AlertCircle size={14} />
                {aiError}
              </div>
            )}

            {aiSuggestion && !suggestionApplied && (
              <div className="raid-ai-suggestion">
                <div className="raid-ai-suggestion-header">
                  <Sparkles size={14} />
                  <span>AI Suggestion</span>
                  <span className="raid-ai-confidence">
                    {Math.round((aiSuggestion.categoryConfidence || 0) * 100)}% confidence
                  </span>
                </div>
                <div className="raid-ai-suggestion-content">
                  <div className="raid-ai-suggestion-item">
                    <strong>Category:</strong> {aiSuggestion.category}
                    <span className="raid-ai-rationale">{aiSuggestion.categoryRationale}</span>
                  </div>
                  <div className="raid-ai-suggestion-item">
                    <strong>Severity:</strong> {aiSuggestion.severity}
                  </div>
                  {aiSuggestion.probability && (
                    <div className="raid-ai-suggestion-item">
                      <strong>Probability:</strong> {aiSuggestion.probability}
                    </div>
                  )}
                  {aiSuggestion.suggestedOwnerRole && (
                    <div className="raid-ai-suggestion-item">
                      <strong>Suggested Owner:</strong> {aiSuggestion.suggestedOwnerRole}
                    </div>
                  )}
                  {aiSuggestion.keyFactors?.length > 0 && (
                    <div className="raid-ai-suggestion-item">
                      <strong>Key factors:</strong> {aiSuggestion.keyFactors.join(', ')}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleApplySuggestion}
                  className="raid-ai-apply-btn"
                >
                  <Check size={14} />
                  Apply Suggestion
                </button>
              </div>
            )}

            {suggestionApplied && (
              <div className="raid-ai-applied">
                <Check size={14} />
                AI suggestion applied - review and adjust as needed
              </div>
            )}
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
