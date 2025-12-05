import React, { useState } from 'react';
import { 
  X, Edit2, Trash2, Save, AlertTriangle, AlertCircle, 
  Info, Link2, User, Calendar, CheckCircle, Clock
} from 'lucide-react';

export default function RaidDetailModal({ 
  item, 
  canEdit, 
  canDelete, 
  onClose, 
  onUpdate, 
  onDelete 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...item });
  const [saving, setSaving] = useState(false);

  // Category configuration
  const categoryConfig = {
    Risk: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
    Assumption: { icon: Info, color: 'text-blue-600', bg: 'bg-blue-100' },
    Issue: { icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-100' },
    Dependency: { icon: Link2, color: 'text-purple-600', bg: 'bg-purple-100' }
  };

  const config = categoryConfig[item.category] || categoryConfig.Risk;
  const CategoryIcon = config.icon;

  async function handleSave() {
    setSaving(true);
    try {
      await onUpdate(editData);
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save changes');
    } finally {
      setSaving(false);
      setIsEditing(false);
    }
  }

  function handleStatusChange(newStatus) {
    setEditData(prev => ({
      ...prev,
      status: newStatus,
      closed_date: ['Closed', 'Accepted', 'Mitigated'].includes(newStatus) 
        ? new Date().toISOString().split('T')[0] 
        : null
    }));
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className={`${config.bg} px-6 py-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <CategoryIcon size={24} className={config.color} />
            <div>
              <span className="font-mono text-sm text-gray-600">{item.raid_ref}</span>
              <h2 className={`font-semibold ${config.color}`}>{item.category}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            {isEditing ? (
              <input
                type="text"
                value={editData.title || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="Short title for this item"
              />
            ) : (
              <p className="text-gray-900 font-medium">
                {item.title || <span className="text-gray-400 italic">No title</span>}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            {isEditing ? (
              <textarea
                value={editData.description || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            ) : (
              <p className="text-gray-700 whitespace-pre-wrap">{item.description}</p>
            )}
          </div>

          {/* Impact */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Impact</label>
            {isEditing ? (
              <textarea
                value={editData.impact || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, impact: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="What is the impact if this materialises?"
              />
            ) : (
              <p className="text-gray-700">
                {item.impact || <span className="text-gray-400 italic">Not specified</span>}
              </p>
            )}
          </div>

          {/* Grid: Probability, Severity, Status */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Probability</label>
              {isEditing ? (
                <select
                  value={editData.probability || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, probability: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select...</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              ) : (
                <span className={`inline-flex px-2 py-1 rounded text-sm font-medium
                  ${item.probability === 'High' ? 'bg-red-100 text-red-800' :
                    item.probability === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    item.probability === 'Low' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'}`}>
                  {item.probability || 'Not set'}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              {isEditing ? (
                <select
                  value={editData.severity || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, severity: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select...</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              ) : (
                <span className={`inline-flex px-2 py-1 rounded text-sm font-medium
                  ${item.severity === 'High' ? 'bg-red-100 text-red-800' :
                    item.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    item.severity === 'Low' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'}`}>
                  {item.severity || 'Not set'}
                </span>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              {isEditing ? (
                <select
                  value={editData.status || 'Open'}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Closed">Closed</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Mitigated">Mitigated</option>
                </select>
              ) : (
                <span className={`inline-flex px-2 py-1 rounded text-sm font-medium
                  ${item.status === 'Open' ? 'bg-blue-100 text-blue-800' :
                    item.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                    item.status === 'Closed' ? 'bg-gray-100 text-gray-800' :
                    item.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                    item.status === 'Mitigated' ? 'bg-teal-100 text-teal-800' :
                    'bg-gray-100 text-gray-800'}`}>
                  {item.status}
                </span>
              )}
            </div>
          </div>

          {/* Mitigation / Action */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mitigation / Action Plan
            </label>
            {isEditing ? (
              <textarea
                value={editData.mitigation || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, mitigation: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                placeholder="Actions to mitigate or address this item"
              />
            ) : (
              <p className="text-gray-700 whitespace-pre-wrap">
                {item.mitigation || <span className="text-gray-400 italic">No mitigation plan</span>}
              </p>
            )}
          </div>

          {/* Due Date */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            {isEditing ? (
              <input
                type="date"
                value={editData.due_date || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, due_date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            ) : (
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar size={16} />
                {item.due_date 
                  ? new Date(item.due_date).toLocaleDateString('en-GB', { 
                      day: 'numeric', month: 'short', year: 'numeric' 
                    })
                  : <span className="text-gray-400 italic">Not set</span>
                }
              </div>
            )}
          </div>

          {/* Resolution (if closed) */}
          {(item.status === 'Closed' || item.status === 'Mitigated' || item.status === 'Accepted' || isEditing) && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Resolution</label>
              {isEditing ? (
                <textarea
                  value={editData.resolution || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, resolution: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="How was this item resolved?"
                />
              ) : (
                <p className="text-gray-700">
                  {item.resolution || <span className="text-gray-400 italic">No resolution recorded</span>}
                </p>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-gray-500">
            <div className="flex flex-wrap gap-4">
              {item.owner && (
                <div className="flex items-center gap-1">
                  <User size={14} />
                  Owner: {item.owner.name}
                </div>
              )}
              {item.milestone && (
                <div className="flex items-center gap-1">
                  <CheckCircle size={14} />
                  Milestone: {item.milestone.milestone_ref}
                </div>
              )}
              {item.raised_date && (
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  Raised: {new Date(item.raised_date).toLocaleDateString('en-GB')}
                </div>
              )}
              {item.source && (
                <div>Source: {item.source}</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between">
          {canDelete && !isEditing && (
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={18} />
              Delete
            </button>
          )}
          {!canDelete && <div />}

          <div className="flex gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setEditData({ ...item });
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
                >
                  <Save size={18} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Close
                </button>
                {canEdit && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    <Edit2 size={18} />
                    Edit
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
