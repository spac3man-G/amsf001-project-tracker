import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle, AlertCircle, Info, Link2 } from 'lucide-react';
import { raidService } from '../../services';
import { supabase } from '../../lib/supabase';

export default function RaidAddForm({ projectId, onClose, onSaved }) {
  const [saving, setSaving] = useState(false);
  const [resources, setResources] = useState([]);
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
    owner_id: '',
    milestone_id: '',
    due_date: '',
    source: ''
  });

  const categories = [
    { value: 'Risk', icon: AlertTriangle, color: 'text-red-600' },
    { value: 'Assumption', icon: Info, color: 'text-blue-600' },
    { value: 'Issue', icon: AlertCircle, color: 'text-orange-600' },
    { value: 'Dependency', icon: Link2, color: 'text-purple-600' }
  ];

  // Fetch resources and milestones for dropdowns
  useEffect(() => {
    async function fetchData() {
      try {
        const [{ data: resourcesData }, { data: milestonesData }] = await Promise.all([
          supabase
            .from('resources')
            .select('id, name, email')
            .eq('project_id', projectId)
            .order('name'),
          supabase
            .from('milestones')
            .select('id, name, milestone_ref')
            .eq('project_id', projectId)
            .order('milestone_ref')
        ]);
        
        setResources(resourcesData || []);
        setMilestones(milestonesData || []);
      } catch (error) {
        console.error('Error fetching dropdown data:', error);
      }
    }
    
    if (projectId) {
      fetchData();
    }
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
    
    if (projectId && formData.category) {
      generateRef();
    }
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
        owner_id: formData.owner_id || null,
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Add RAID Item</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Category Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
            <div className="grid grid-cols-4 gap-2">
              {categories.map(cat => {
                const Icon = cat.icon;
                const isSelected = formData.category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => handleChange('category', cat.value)}
                    className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1
                      ${isSelected 
                        ? 'border-teal-500 bg-teal-50' 
                        : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <Icon size={20} className={isSelected ? 'text-teal-600' : cat.color} />
                    <span className={`text-sm font-medium ${isSelected ? 'text-teal-700' : 'text-gray-700'}`}>
                      {cat.value}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reference (auto-generated) */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
            <input
              type="text"
              value={formData.raid_ref}
              onChange={(e) => handleChange('raid_ref', e.target.value.toUpperCase())}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono"
              readOnly
            />
            <p className="text-xs text-gray-500 mt-1">Auto-generated based on category</p>
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="Short title for quick identification"
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="Detailed description of the item"
              required
            />
          </div>

          {/* Impact */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Impact</label>
            <textarea
              value={formData.impact}
              onChange={(e) => handleChange('impact', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="What is the impact if this materialises?"
            />
          </div>

          {/* Probability & Severity */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Probability</label>
              <select
                value={formData.probability}
                onChange={(e) => handleChange('probability', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select...</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select
                value={formData.severity}
                onChange={(e) => handleChange('severity', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select...</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          {/* Mitigation */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mitigation / Action Plan
            </label>
            <textarea
              value={formData.mitigation}
              onChange={(e) => handleChange('mitigation', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="Actions to mitigate or address this item"
            />
          </div>

          {/* Owner & Due Date */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
              <select
                value={formData.owner_id}
                onChange={(e) => handleChange('owner_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Select owner...</option>
                {resources.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => handleChange('due_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Linked Milestone */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Linked Milestone (optional)
            </label>
            <select
              value={formData.milestone_id}
              onChange={(e) => handleChange('milestone_id', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
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
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <input
              type="text"
              value={formData.source}
              onChange={(e) => handleChange('source', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="e.g., Project Meeting 2025-12-01, SoW v2.61"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !formData.description.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Create Item'}
          </button>
        </div>
      </div>
    </div>
  );
}
