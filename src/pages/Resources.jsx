import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Plus, Edit2, Save, X, Trash2, Mail, Phone, Briefcase, DollarSign, Link2, UserCheck } from 'lucide-react';
import { useTestUsers } from '../contexts/TestUserContext';
import { useToast } from '../components/Toast';
import { TablePageSkeleton } from '../components/SkeletonLoader';
import StatCard, { StatGrid } from '../components/StatCard';
import { useConfirmDialog } from '../components/ConfirmDialog';
import EmptyState from '../components/EmptyState';
import { canManageResources } from '../utils/permissions';
import { formatCurrency } from '../utils/statusHelpers';
import { useAuth } from '../hooks';

export default function Resources() {
  const { userRole, loading: authLoading } = useAuth();
  const toast = useToast();
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const { showTestUsers, testUserIds } = useTestUsers();

  const [resources, setResources] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const [newResource, setNewResource] = useState({
    name: '', email: '', phone: '', role: 'team_member', day_rate: '', user_id: ''
  });

  const roleOptions = [
    { value: 'project_manager', label: 'Project Manager' },
    { value: 'team_lead', label: 'Team Lead' },
    { value: 'team_member', label: 'Team Member' },
    { value: 'consultant', label: 'Consultant' },
    { value: 'contractor', label: 'Contractor' }
  ];

  useEffect(() => { if (!authLoading) fetchData(); }, [authLoading, showTestUsers]);

  async function fetchData() {
    try {
      setLoading(true);
      const { data: resourcesData, error: resError } = await supabase.from('resources').select('*').order('name');
      if (resError) { console.error('Resources error:', resError); toast.error('Failed to load resources'); }
      else {
        let filteredResources = resourcesData || [];
        if (!showTestUsers && testUserIds?.length > 0) {
          filteredResources = filteredResources.filter(r => !r.user_id || !testUserIds.includes(r.user_id));
        }
        setResources(filteredResources);
      }

      const { data: profilesData, error: profError } = await supabase.from('profiles').select('id, email, full_name, role').order('email');
      if (profError) console.error('Profiles error:', profError);
      else {
        let filteredProfiles = profilesData || [];
        if (!showTestUsers && testUserIds?.length > 0) {
          filteredProfiles = filteredProfiles.filter(p => !testUserIds.includes(p.id));
        }
        setProfiles(filteredProfiles);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  function canEdit() { return canManageResources(userRole); }

  async function handleAdd() {
    if (!newResource.name || !newResource.email) { toast.warning('Please fill in name and email'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('resources').insert([{
        name: newResource.name, email: newResource.email, phone: newResource.phone || null,
        role: newResource.role, day_rate: newResource.day_rate ? parseFloat(newResource.day_rate) : null,
        user_id: newResource.user_id || null
      }]);
      if (error) throw error;
      await fetchData();
      setShowAddForm(false);
      setNewResource({ name: '', email: '', phone: '', role: 'team_member', day_rate: '', user_id: '' });
      toast.success('Resource added successfully!');
    } catch (error) {
      console.error('Error adding resource:', error);
      toast.error('Failed to add resource', error.message);
    } finally { setSaving(false); }
  }

  async function handleEdit(resource) {
    setEditingId(resource.id);
    setEditForm({
      name: resource.name || '', email: resource.email || '', phone: resource.phone || '',
      role: resource.role || 'team_member', day_rate: resource.day_rate || '', user_id: resource.user_id || ''
    });
  }

  async function handleSave(id) {
    setSaving(true);
    try {
      const { error } = await supabase.from('resources').update({
        name: editForm.name, email: editForm.email, phone: editForm.phone || null,
        role: editForm.role, day_rate: editForm.day_rate ? parseFloat(editForm.day_rate) : null,
        user_id: editForm.user_id || null
      }).eq('id', id);
      if (error) throw error;
      await fetchData();
      setEditingId(null);
      toast.success('Resource updated!');
    } catch (error) {
      console.error('Error updating resource:', error);
      toast.error('Failed to update', error.message);
    } finally { setSaving(false); }
  }

  function handleCancel() { setEditingId(null); setEditForm({}); }

  async function handleDelete(id) {
    const confirmed = await confirm({
      title: 'Delete Resource',
      message: 'Delete this resource? This may affect linked timesheets and expenses.',
      confirmText: 'Delete',
      variant: 'danger'
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase.from('resources').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
      toast.success('Resource deleted');
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Failed to delete', error.message);
    }
  }

  function getRoleLabel(role) { return roleOptions.find(r => r.value === role)?.label || role; }
  function getRoleColor(role) {
    switch (role) {
      case 'project_manager': return '#8b5cf6';
      case 'team_lead': return '#3b82f6';
      case 'consultant': return '#f59e0b';
      case 'contractor': return '#10b981';
      default: return '#64748b';
    }
  }

  const linkedCount = resources.filter(r => r.user_id).length;
  const unlinkedCount = resources.filter(r => !r.user_id).length;
  const totalDayRate = resources.reduce((sum, r) => sum + parseFloat(r.day_rate || 0), 0);

  if (authLoading || loading) return <TablePageSkeleton />;

  return (
    <div className="page-container">
      <ConfirmDialogComponent />
      
      <div className="page-header">
        <div className="page-title">
          <Users size={28} />
          <div><h1>Resources</h1><p>Manage team members and their rates</p></div>
        </div>
        {!showAddForm && canEdit() && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)}><Plus size={18} /> Add Resource</button>
        )}
      </div>

      {/* Stats */}
      <StatGrid columns={4}>
        <StatCard label="TOTAL RESOURCES" value={resources.length} labelFirst />
        <StatCard label="LINKED TO USERS" value={linkedCount} valueColor="#10b981" labelFirst />
        <StatCard label="NOT LINKED" value={unlinkedCount} valueColor="#f59e0b" labelFirst />
        <StatCard label="TOTAL DAY RATES" value={formatCurrency(totalDayRate)} valueColor="#3b82f6" labelFirst />
      </StatGrid>

      {/* Add Resource Form */}
      {showAddForm && canEdit() && (
        <div className="card" style={{ marginBottom: '1.5rem', border: '2px solid var(--primary)' }}>
          <h3 style={{ marginBottom: '1rem' }}>Add Resource</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Name *</label>
              <input type="text" className="form-input" placeholder="Full name" value={newResource.name} onChange={(e) => setNewResource({ ...newResource, name: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Email *</label>
              <input type="email" className="form-input" placeholder="email@example.com" value={newResource.email} onChange={(e) => setNewResource({ ...newResource, email: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input type="tel" className="form-input" placeholder="+44..." value={newResource.phone} onChange={(e) => setNewResource({ ...newResource, phone: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Role</label>
              <select className="form-input" value={newResource.role} onChange={(e) => setNewResource({ ...newResource, role: e.target.value })}>
                {roleOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Day Rate (£)</label>
              <input type="number" step="0.01" min="0" className="form-input" placeholder="0.00" value={newResource.day_rate} onChange={(e) => setNewResource({ ...newResource, day_rate: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Link to User Account</label>
              <select className="form-input" value={newResource.user_id} onChange={(e) => setNewResource({ ...newResource, user_id: e.target.value })}>
                <option value="">-- Not linked --</option>
                {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name || p.email} ({p.role})</option>)}
              </select>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Linking allows the user to submit timesheets/expenses as this resource</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={handleAdd} disabled={saving}><Save size={16} /> {saving ? 'Saving...' : 'Save Resource'}</button>
            <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}><X size={16} /> Cancel</button>
          </div>
        </div>
      )}

      {/* Resources Table */}
      <div className="card">
        <table>
          <thead>
            <tr><th>Name</th><th>Contact</th><th>Role</th><th style={{ textAlign: 'right' }}>Day Rate</th><th>Linked User</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {resources.length === 0 ? (
              <EmptyState.TableRow colSpan={6} icon="resources" message="No resources found. Add your first resource to get started." />
            ) : resources.map(res => (
              <tr key={res.id}>
                <td>
                  {editingId === res.id ? (
                    <input type="text" className="form-input" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: getRoleColor(res.role), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '600', fontSize: '0.9rem' }}>
                        {res.name?.charAt(0) || '?'}
                      </div>
                      <span style={{ fontWeight: '500' }}>{res.name}</span>
                    </div>
                  )}
                </td>
                <td>
                  {editingId === res.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <input type="email" className="form-input" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="Email" />
                      <input type="tel" className="form-input" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="Phone" />
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}><Mail size={14} style={{ color: '#64748b' }} />{res.email}</div>
                      {res.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}><Phone size={12} />{res.phone}</div>}
                    </div>
                  )}
                </td>
                <td>
                  {editingId === res.id ? (
                    <select className="form-input" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                      {roleOptions.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  ) : (
                    <span style={{ padding: '0.25rem 0.75rem', borderRadius: '9999px', backgroundColor: `${getRoleColor(res.role)}15`, color: getRoleColor(res.role), fontSize: '0.85rem', fontWeight: '500' }}>
                      {getRoleLabel(res.role)}
                    </span>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  {editingId === res.id ? (
                    <input type="number" step="0.01" className="form-input" value={editForm.day_rate} onChange={(e) => setEditForm({ ...editForm, day_rate: e.target.value })} style={{ width: '100px', textAlign: 'right' }} />
                  ) : res.day_rate ? <span style={{ fontWeight: '600' }}>{formatCurrency(res.day_rate)}</span> : <span style={{ color: '#9ca3af' }}>-</span>}
                </td>
                <td>
                  {editingId === res.id ? (
                    <select className="form-input" value={editForm.user_id} onChange={(e) => setEditForm({ ...editForm, user_id: e.target.value })}>
                      <option value="">-- Not linked --</option>
                      {profiles.map(p => <option key={p.id} value={p.id}>{p.full_name || p.email}</option>)}
                    </select>
                  ) : res.user_id ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><UserCheck size={16} style={{ color: '#10b981' }} /><span style={{ fontSize: '0.85rem', color: '#10b981' }}>Linked</span></div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Link2 size={16} style={{ color: '#9ca3af' }} /><span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Not linked</span></div>
                  )}
                </td>
                <td>
                  {!canEdit() ? <span style={{ color: '#9ca3af', fontSize: '0.85rem' }}>View only</span> : editingId === res.id ? (
                    <div className="action-buttons">
                      <button className="btn-icon btn-success" onClick={() => handleSave(res.id)} title="Save" disabled={saving}><Save size={16} /></button>
                      <button className="btn-icon btn-secondary" onClick={handleCancel} title="Cancel"><X size={16} /></button>
                    </div>
                  ) : (
                    <div className="action-buttons">
                      <button className="btn-icon" onClick={() => handleEdit(res)} title="Edit"><Edit2 size={16} /></button>
                      <button className="btn-icon btn-danger" onClick={() => handleDelete(res.id)} title="Delete"><Trash2 size={16} /></button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info */}
      <div className="card" style={{ marginTop: '1.5rem', backgroundColor: '#eff6ff', borderLeft: '4px solid #3b82f6' }}>
        <h4 style={{ marginBottom: '0.5rem', color: '#1e40af' }}>ℹ️ About Resource Linking</h4>
        <p style={{ color: '#1e40af', fontSize: '0.9rem', margin: 0 }}>
          Linking a resource to a user account allows that user to submit timesheets and expenses under their name. Unlinked resources can still be used by admins and project managers to log time on their behalf.
        </p>
      </div>
    </div>
  );
}
