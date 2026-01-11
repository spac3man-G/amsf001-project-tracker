/**
 * VendorsHub Page
 * 
 * Main hub page for vendor management.
 * Displays vendors in pipeline view or list view.
 * Supports CRUD operations and status transitions.
 * Now includes AI-powered market research (Phase 8B).
 * 
 * @version 1.1
 * @created 01 January 2026
 * @updated 04 January 2026 - Added Market Research (Phase 8B)
 * @phase Phase 5 - Vendor Management (Task 5A.2), Phase 8B - AI Features
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List as ListIcon,
  Table,
  RefreshCw,
  Download,
  MoreVertical,
  ChevronRight,
  ArrowRight,
  Trash2,
  Edit,
  Key,
  X,
  Sparkles
} from 'lucide-react';
import { useEvaluation } from '../../contexts/EvaluationContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  vendorsService, 
  aiService,
  VENDOR_STATUSES,
  VENDOR_STATUS_CONFIG,
  PIPELINE_STAGES
} from '../../services/evaluator';
import { VendorPipeline, VendorCard, VendorForm, VendorsGridView } from '../../components/evaluator';
import { MarketResearchResults } from '../../components/evaluator/ai';
import './VendorsHub.css';

function VendorsHub() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentEvaluation } = useEvaluation();
  const { user } = useAuth();

  // State
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState(searchParams.get('view') || 'list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Context menu state
  const [menuVendor, setMenuVendor] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  
  // AI Market Research state (Phase 8B)
  const [runningResearch, setRunningResearch] = useState(false);
  const [researchResults, setResearchResults] = useState(null);
  const [showResearchResults, setShowResearchResults] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // Fetch vendors
  const fetchVendors = useCallback(async () => {
    if (!currentEvaluation?.id) return;

    try {
      setLoading(true);
      setError(null);

      const data = await vendorsService.getAllWithDetails(currentEvaluation.id, {
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined
      });

      setVendors(data);
    } catch (err) {
      console.error('Failed to fetch vendors:', err);
      setError('Failed to load vendors. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentEvaluation?.id, searchTerm, statusFilter]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  // Update URL when view mode changes
  useEffect(() => {
    setSearchParams({ view: viewMode }, { replace: true });
  }, [viewMode, setSearchParams]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handlers
  const handleVendorClick = (vendor) => {
    navigate(`/evaluator/vendors/${vendor.id}`);
  };

  const handleAddVendor = async (formData) => {
    if (!currentEvaluation?.id) return;

    try {
      setIsSubmitting(true);

      const vendorData = {
        evaluation_project_id: currentEvaluation.id,
        name: formData.name,
        description: formData.description,
        website: formData.website,
        notes: formData.notes,
        created_by: user?.id
      };

      const newVendor = await vendorsService.createVendor(vendorData);

      // Add primary contact if provided
      if (formData.contact && (formData.contact.name || formData.contact.email)) {
        await vendorsService.addContact(newVendor.id, {
          ...formData.contact,
          is_primary: true
        });
      }

      setShowAddModal(false);
      setSuccessMessage('Vendor added successfully');
      fetchVendors();
    } catch (err) {
      console.error('Failed to add vendor:', err);
      setError('Failed to add vendor. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditVendor = async (formData) => {
    if (!editingVendor) return;

    try {
      setIsSubmitting(true);

      await vendorsService.updateVendor(editingVendor.id, {
        name: formData.name,
        description: formData.description,
        website: formData.website,
        notes: formData.notes
      });

      setEditingVendor(null);
      setSuccessMessage('Vendor updated successfully');
      fetchVendors();
    } catch (err) {
      console.error('Failed to update vendor:', err);
      setError('Failed to update vendor. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (vendor, newStatus) => {
    if (!user?.id) return;

    try {
      await vendorsService.updateStatus(vendor.id, newStatus, user.id);
      fetchVendors();
    } catch (err) {
      console.error('Failed to update vendor status:', err);
      setError(`Failed to update status: ${err.message}`);
    }
    setMenuVendor(null);
  };

  const handleDeleteVendor = async (vendor) => {
    if (!confirm(`Are you sure you want to delete "${vendor.name}"?`)) return;

    try {
      await vendorsService.delete(vendor.id, user?.id);
      setSuccessMessage('Vendor deleted');
      fetchVendors();
    } catch (err) {
      console.error('Failed to delete vendor:', err);
      setError('Failed to delete vendor. Please try again.');
    }
    setMenuVendor(null);
  };

  const handleGeneratePortalAccess = async (vendor) => {
    try {
      await vendorsService.generatePortalAccessCode(vendor.id);
      setSuccessMessage('Portal access enabled');
      fetchVendors();
    } catch (err) {
      console.error('Failed to generate portal access:', err);
      setError('Failed to generate portal access. Please try again.');
    }
    setMenuVendor(null);
  };

  const handleVendorMenuClick = (vendor, event) => {
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({ 
      x: rect.right, 
      y: rect.bottom 
    });
    setMenuVendor(vendor);
  };

  // AI Market Research handlers (Phase 8B)
  const handleRunMarketResearch = async () => {
    if (!currentEvaluation?.id || !user?.id) return;
    
    setRunningResearch(true);
    setError(null);
    
    try {
      const results = await aiService.runMarketResearch(
        currentEvaluation.id,
        user.id,
        {} // industry context passed as additional context if needed
      );
      
      if (results.success) {
        setResearchResults(results);
        setShowResearchResults(true);
      } else {
        throw new Error(results.error || 'Market research failed');
      }
    } catch (err) {
      console.error('Market research error:', err);
      setError(err.message || 'Failed to run market research');
    } finally {
      setRunningResearch(false);
    }
  };
  
  const handleAddResearchedVendors = async (selectedVendors) => {
    if (!currentEvaluation?.id || !user?.id) return;
    
    try {
      const result = await aiService.addResearchedVendors(
        currentEvaluation.id,
        user.id,
        selectedVendors
      );
      
      setSuccessMessage(`Added ${result.imported} vendors from market research`);
      fetchVendors();
      
      return result;
    } catch (err) {
      console.error('Add vendors error:', err);
      setError(err.message || 'Failed to add vendors');
      throw err;
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    if (menuVendor) {
      const handleClickOutside = () => setMenuVendor(null);
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [menuVendor]);

  // Get summary stats
  const stats = {
    total: vendors.length,
    inPipeline: vendors.filter(v => PIPELINE_STAGES.includes(v.status)).length,
    shortlisted: vendors.filter(v => v.status === VENDOR_STATUSES.SHORT_LIST).length,
    selected: vendors.filter(v => v.status === VENDOR_STATUSES.SELECTED).length
  };

  // Filter vendors for list view
  const filteredVendors = vendors.filter(vendor => {
    if (statusFilter !== 'all' && vendor.status !== statusFilter) return false;
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        vendor.name.toLowerCase().includes(search) ||
        vendor.description?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  if (!currentEvaluation) {
    return (
      <div className="vendors-hub">
        <div className="vendors-hub-empty">
          <Building2 size={48} />
          <h2>No Evaluation Selected</h2>
          <p>Please select an evaluation project to manage vendors.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vendors-hub">
      {/* Header */}
      <div className="vendors-hub-header">
        <div className="vendors-hub-title-section">
          <h1>
            <Building2 size={24} />
            Vendor Management
          </h1>
          <p className="vendors-hub-subtitle">
            {currentEvaluation.name}
          </p>
        </div>

        <div className="vendors-hub-actions">
          <button 
            className="vendors-hub-btn vendors-hub-btn-ai"
            onClick={handleRunMarketResearch}
            disabled={runningResearch}
            title="AI-powered vendor discovery"
          >
            <Sparkles size={16} className={runningResearch ? 'spin' : ''} />
            {runningResearch ? 'Researching...' : 'Market Research'}
          </button>
          <button 
            className="vendors-hub-btn vendors-hub-btn-secondary"
            onClick={fetchVendors}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>
          <button 
            className="vendors-hub-btn vendors-hub-btn-primary"
            onClick={() => setShowAddModal(true)}
          >
            <Plus size={16} />
            Add Vendor
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="vendors-hub-stats">
        <div className="vendor-stat">
          <span className="vendor-stat-value">{stats.total}</span>
          <span className="vendor-stat-label">Total Vendors</span>
        </div>
        <div className="vendor-stat">
          <span className="vendor-stat-value">{stats.inPipeline}</span>
          <span className="vendor-stat-label">In Pipeline</span>
        </div>
        <div className="vendor-stat">
          <span className="vendor-stat-value">{stats.shortlisted}</span>
          <span className="vendor-stat-label">Shortlisted</span>
        </div>
        <div className="vendor-stat">
          <span className="vendor-stat-value">{stats.selected}</span>
          <span className="vendor-stat-label">Selected</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="vendors-hub-toolbar">
        <div className="vendors-hub-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              className="vendors-search-clear"
              onClick={() => setSearchTerm('')}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="vendors-hub-filters">
          <div className="vendors-filter-group">
            <Filter size={16} />
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {Object.entries(VENDOR_STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          <div className="vendors-view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'pipeline' ? 'active' : ''}`}
              onClick={() => setViewMode('pipeline')}
              title="Pipeline View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Card View"
            >
              <ListIcon size={18} />
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View (Excel-like)"
            >
              <Table size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="vendors-hub-success">
          {successMessage}
          <button onClick={() => setSuccessMessage(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="vendors-hub-error">
          {error}
          <button onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="vendors-hub-content">
        {viewMode === 'pipeline' && (
          <VendorPipeline
            vendors={vendors}
            loading={loading}
            onVendorClick={handleVendorClick}
            onStatusChange={handleStatusChange}
            onVendorMenuClick={handleVendorMenuClick}
            onAddVendor={() => setShowAddModal(true)}
          />
        )}

        {viewMode === 'grid' && (
          <VendorsGridView
            vendors={filteredVendors}
            onDataChange={fetchVendors}
            onVendorClick={handleVendorClick}
            canManage={true}
          />
        )}

        {viewMode === 'list' && (
          <div className="vendors-list-view">
            {loading && <div className="vendors-loading">Loading vendors...</div>}

            {!loading && filteredVendors.length === 0 && (
              <div className="vendors-empty">
                <Building2 size={48} />
                <h3>No vendors found</h3>
                <p>
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Get started by adding your first vendor'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <div className="vendors-empty-actions">
                    <button
                      className="vendors-hub-btn vendors-hub-btn-primary"
                      onClick={() => setShowAddModal(true)}
                    >
                      <Plus size={16} />
                      Add Vendor
                    </button>
                    <button
                      className="vendors-hub-btn vendors-hub-btn-ai"
                      onClick={handleRunMarketResearch}
                      disabled={runningResearch}
                    >
                      <Sparkles size={16} />
                      AI Research
                    </button>
                  </div>
                )}
              </div>
            )}

            {!loading && filteredVendors.length > 0 && (
              <div className="vendors-grid">
                {filteredVendors.map(vendor => (
                  <VendorCard
                    key={vendor.id}
                    vendor={vendor}
                    onClick={handleVendorClick}
                    onMenuClick={handleVendorMenuClick}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {menuVendor && (
        <div 
          className="vendor-context-menu"
          style={{ 
            top: menuPosition.y,
            left: Math.min(menuPosition.x, window.innerWidth - 200)
          }}
          onClick={e => e.stopPropagation()}
        >
          <button onClick={() => handleVendorClick(menuVendor)}>
            <ChevronRight size={16} />
            View Details
          </button>
          <button onClick={() => {
            setEditingVendor(menuVendor);
            setMenuVendor(null);
          }}>
            <Edit size={16} />
            Edit Vendor
          </button>
          
          <div className="vendor-menu-divider" />
          
          <div className="vendor-menu-section">
            <span className="vendor-menu-label">Move to</span>
            {vendorsService.getValidTransitions(menuVendor.status)
              .filter(s => s !== VENDOR_STATUSES.REJECTED)
              .map(status => (
                <button 
                  key={status}
                  onClick={() => handleStatusChange(menuVendor, status)}
                >
                  <ArrowRight size={16} />
                  {VENDOR_STATUS_CONFIG[status]?.label}
                </button>
              ))
            }
          </div>

          <div className="vendor-menu-divider" />

          {!menuVendor.portal_enabled && (
            <button onClick={() => handleGeneratePortalAccess(menuVendor)}>
              <Key size={16} />
              Enable Portal Access
            </button>
          )}

          <button 
            className="vendor-menu-danger"
            onClick={() => handleDeleteVendor(menuVendor)}
          >
            <Trash2 size={16} />
            Delete Vendor
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingVendor) && (
        <VendorForm
          vendor={editingVendor}
          onSubmit={editingVendor ? handleEditVendor : handleAddVendor}
          onCancel={() => {
            setShowAddModal(false);
            setEditingVendor(null);
          }}
          isSubmitting={isSubmitting}
        />
      )}
      
      {/* Market Research Results Modal (Phase 8B) */}
      <MarketResearchResults
        isOpen={showResearchResults}
        onClose={() => setShowResearchResults(false)}
        researchResults={researchResults}
        onAddVendors={handleAddResearchedVendors}
      />
    </div>
  );
}

export default VendorsHub;
