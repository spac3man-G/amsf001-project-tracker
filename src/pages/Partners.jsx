/**
 * Partners Page
 * 
 * Manages third-party partner companies for resource allocation and invoicing.
 * Only accessible to Admin and Supplier PM roles.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Pencil, Trash2, Mail, User, FileText, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { usePermissions } from '../hooks/usePermissions';
import { partnersService } from '../services';
import { supabase } from '../lib/supabase';
import { 
  LoadingSpinner, 
  PageHeader, 
  StatCard, 
  ConfirmDialog 
} from '../components/common';

export default function Partners() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projectId } = useProject();
  const { canManagePartners, hasRole } = usePermissions();
  
  // State
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, partner: null, dependents: null });
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    contact_name: '',
    contact_email: '',
    payment_terms: 'Net 30',
    notes: '',
    is_active: true
  });

  // Check access
  const canAccess = hasRole(['admin', 'supplier_pm']);

  // Load partners
  useEffect(() => {
    if (projectId && canAccess) {
      loadPartners();
    }
  }, [projectId, canAccess]);

  const loadPartners = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await partnersService.getAll(projectId);
      setPartners(data);
    } catch (err) {
      console.error('Failed to load partners:', err);
      setError('Failed to load partners. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Form handlers
  const resetForm = () => {
    setFormData({
      name: '',
      contact_name: '',
      contact_email: '',
      payment_terms: 'Net 30',
      notes: '',
      is_active: true
    });
    setEditingPartner(null);
    setShowForm(false);
  };

  const handleEdit = (partner) => {
    setFormData({
      name: partner.name || '',
      contact_name: partner.contact_name || '',
      contact_email: partner.contact_email || '',
      payment_terms: partner.payment_terms || 'Net 30',
      notes: partner.notes || '',
      is_active: partner.is_active ?? true
    });
    setEditingPartner(partner);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Partner name is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (editingPartner) {
        // Update existing partner
        await partnersService.update(editingPartner.id, formData);
      } else {
        // Create new partner
        await partnersService.create({
          ...formData,
          project_id: projectId
        });
      }

      await loadPartners();
      resetForm();
    } catch (err) {
      console.error('Failed to save partner:', err);
      setError(err.message || 'Failed to save partner. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.partner) return;

    try {
      setSaving(true);
      await partnersService.delete(deleteConfirm.partner.id);
      await loadPartners();
      setDeleteConfirm({ show: false, partner: null, dependents: null });
    } catch (err) {
      console.error('Failed to delete partner:', err);
      setError('Failed to delete partner. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Fetch dependent record counts before showing delete dialog
  const handleDeleteClick = async (partner) => {
    try {
      // Get count of resources linked to this partner
      const { data: resources, error: resError } = await supabase
        .from('resources')
        .select('id')
        .eq('partner_id', partner.id);
      
      if (resError) throw resError;

      const resourceCount = resources?.length || 0;
      let timesheetCount = 0;
      let expenseCount = 0;
      let invoiceCount = 0;

      if (resourceCount > 0) {
        const resourceIds = resources.map(r => r.id);
        
        // Get timesheet count
        const { count: tsCount } = await supabase
          .from('timesheets')
          .select('*', { count: 'exact', head: true })
          .in('resource_id', resourceIds);
        timesheetCount = tsCount || 0;

        // Get expense count
        const { count: expCount } = await supabase
          .from('expenses')
          .select('*', { count: 'exact', head: true })
          .in('resource_id', resourceIds);
        expenseCount = expCount || 0;
      }

      // Get invoice count
      const { count: invCount } = await supabase
        .from('partner_invoices')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', partner.id);
      invoiceCount = invCount || 0;

      setDeleteConfirm({
        show: true,
        partner,
        dependents: { resourceCount, timesheetCount, expenseCount, invoiceCount }
      });
    } catch (err) {
      console.error('Error fetching dependents:', err);
      // Still show dialog but without counts
      setDeleteConfirm({ show: true, partner, dependents: null });
    }
  };

  const handleToggleActive = async (partner) => {
    try {
      await partnersService.toggleActive(partner.id);
      await loadPartners();
    } catch (err) {
      console.error('Failed to toggle partner status:', err);
      setError('Failed to update partner status.');
    }
  };

  // Access denied
  if (!canAccess) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            You don't have permission to access this page. Partners management is only available to Admin and Supplier PM roles.
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return <LoadingSpinner size="large" message="Loading partners..." fullPage />;
  }

  // Stats
  const activePartners = partners.filter(p => p.is_active).length;
  const inactivePartners = partners.filter(p => !p.is_active).length;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Partners"
        subtitle="Manage third-party partner companies for resource allocation and invoicing"
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Partner
          </button>
        }
      />

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-red-600 underline text-sm mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={Building2}
          label="Total Partners"
          value={partners.length}
        />
        <StatCard
          icon={ToggleRight}
          label="Active Partners"
          value={activePartners}
          color="green"
        />
        <StatCard
          icon={ToggleLeft}
          label="Inactive Partners"
          value={inactivePartners}
          color="gray"
        />
      </div>

      {/* Partner Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingPartner ? 'Edit Partner' : 'Add New Partner'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Agilisys"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Name
                  </label>
                  <input
                    type="text"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Primary contact name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="contact@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Net 60">Net 60</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Additional notes about this partner..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-700">
                    Partner is active
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : (editingPartner ? 'Update Partner' : 'Add Partner')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Partners List */}
      {partners.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Partners Yet</h3>
          <p className="text-gray-500 mb-4">
            Add your first partner company to start tracking third-party resources and expenses.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Partner
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Partner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Terms
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {partners.map((partner) => (
                <tr key={partner.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div 
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => navigate(`/partners/${partner.id}`)}
                      title="Click to view details"
                    >
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          <span style={{ color: '#2563eb' }}>{partner.name}</span>
                          <ExternalLink size={14} style={{ color: '#9ca3af' }} />
                        </div>
                        {partner.notes && (
                          <div className="text-sm text-gray-500 truncate max-w-xs" title={partner.notes}>
                            {partner.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      {partner.contact_name && (
                        <div className="flex items-center gap-2 text-sm text-gray-900">
                          <User className="w-4 h-4 text-gray-400" />
                          {partner.contact_name}
                        </div>
                      )}
                      {partner.contact_email && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <a href={`mailto:${partner.contact_email}`} className="hover:text-blue-600">
                            {partner.contact_email}
                          </a>
                        </div>
                      )}
                      {!partner.contact_name && !partner.contact_email && (
                        <span className="text-sm text-gray-400">No contact info</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <FileText className="w-4 h-4 text-gray-400" />
                      {partner.payment_terms}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(partner)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        partner.is_active
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {partner.is_active ? (
                        <>
                          <ToggleRight className="w-3 h-3" />
                          Active
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-3 h-3" />
                          Inactive
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(partner)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit partner"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(partner)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete partner"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, partner: null, dependents: null })}
        onConfirm={handleDelete}
        title="Delete Partner"
        message={
          <div>
            <p>Are you sure you want to delete "<strong>{deleteConfirm.partner?.name}</strong>"?</p>
            {deleteConfirm.dependents && (
              <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fef2f2', borderRadius: '6px', border: '1px solid #fecaca' }}>
                <p style={{ fontWeight: '600', color: '#991b1b', marginBottom: '0.5rem' }}>⚠️ This will also affect:</p>
                <ul style={{ margin: '0', paddingLeft: '1.25rem', fontSize: '0.875rem', color: '#7f1d1d' }}>
                  {deleteConfirm.dependents.resourceCount > 0 && (
                    <li>{deleteConfirm.dependents.resourceCount} linked resource{deleteConfirm.dependents.resourceCount !== 1 ? 's' : ''} (will be unlinked)</li>
                  )}
                  {deleteConfirm.dependents.timesheetCount > 0 && (
                    <li>{deleteConfirm.dependents.timesheetCount} timesheet{deleteConfirm.dependents.timesheetCount !== 1 ? 's' : ''}</li>
                  )}
                  {deleteConfirm.dependents.expenseCount > 0 && (
                    <li>{deleteConfirm.dependents.expenseCount} expense{deleteConfirm.dependents.expenseCount !== 1 ? 's' : ''}</li>
                  )}
                  {deleteConfirm.dependents.invoiceCount > 0 && (
                    <li>{deleteConfirm.dependents.invoiceCount} invoice{deleteConfirm.dependents.invoiceCount !== 1 ? 's' : ''}</li>
                  )}
                </ul>
              </div>
            )}
            <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>This action cannot be undone.</p>
          </div>
        }
        confirmText="Delete"
        type="danger"
      />
    </div>
  );
}
