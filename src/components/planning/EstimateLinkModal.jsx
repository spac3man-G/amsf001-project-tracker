/**
 * EstimateLinkModal - Link plan items to estimate components
 * 
 * Allows users to:
 * - Link a plan item to an existing estimate component
 * - Create a new estimate with a component pre-populated from the plan item
 * - Unlink a plan item from its current estimate component
 * 
 * @version 1.0
 * @created 26 December 2025
 * @checkpoint 4 - Linked Estimates Feature
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Link2, 
  Unlink, 
  Plus, 
  Calculator, 
  ChevronRight,
  Loader2,
  AlertCircle,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { estimatesService, ESTIMATE_STATUS } from '../../services';
import planItemsService from '../../services/planItemsService';
import { useToast } from '../../contexts/ToastContext';
import './EstimateLinkModal.css';

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0);
}

export default function EstimateLinkModal({ 
  planItem, 
  projectId,
  onClose, 
  onLinked 
}) {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  
  // State
  const [estimates, setEstimates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [selectedEstimateId, setSelectedEstimateId] = useState(null);
  const [selectedComponentId, setSelectedComponentId] = useState(null);
  const [expandedEstimate, setExpandedEstimate] = useState(null);
  const [mode, setMode] = useState('select'); // 'select' | 'create'

  // Load estimates on mount
  useEffect(() => {
    async function loadEstimates() {
      try {
        setLoading(true);
        const list = await estimatesService.getAll(projectId);
        
        // For each estimate, get full details including components
        const estimatesWithComponents = await Promise.all(
          list.map(async (est) => {
            try {
              const full = await estimatesService.getWithDetails(est.id);
              return full;
            } catch {
              return { ...est, components: [] };
            }
          })
        );
        
        setEstimates(estimatesWithComponents);
        
        // If plan item is already linked, pre-select that component
        if (planItem.estimate_component_id) {
          for (const est of estimatesWithComponents) {
            const comp = est.components?.find(c => c.id === planItem.estimate_component_id);
            if (comp) {
              setSelectedEstimateId(est.id);
              setSelectedComponentId(comp.id);
              setExpandedEstimate(est.id);
              break;
            }
          }
        }
      } catch (err) {
        console.error('Failed to load estimates:', err);
        showError('Failed to load estimates');
      } finally {
        setLoading(false);
      }
    }
    
    loadEstimates();
  }, [projectId, planItem.estimate_component_id, showError]);

  // Handle linking to existing component
  const handleLinkToComponent = async () => {
    if (!selectedComponentId) return;
    
    try {
      setLinking(true);
      await planItemsService.linkToEstimateComponent(planItem.id, selectedComponentId);
      showSuccess('Plan item linked to estimate');
      onLinked?.();
      onClose();
    } catch (err) {
      console.error('Failed to link:', err);
      showError('Failed to link plan item');
    } finally {
      setLinking(false);
    }
  };

  // Handle unlinking
  const handleUnlink = async () => {
    try {
      setLinking(true);
      await planItemsService.unlinkFromEstimateComponent(planItem.id);
      showSuccess('Plan item unlinked from estimate');
      onLinked?.();
      onClose();
    } catch (err) {
      console.error('Failed to unlink:', err);
      showError('Failed to unlink plan item');
    } finally {
      setLinking(false);
    }
  };

  // Handle creating new estimate with pre-populated component
  const handleCreateNewEstimate = async () => {
    try {
      setLinking(true);
      
      const newEstimate = await estimatesService.saveFullEstimate(projectId, {
        name: `Estimate for ${planItem.name}`,
        description: `Created from plan item: ${planItem.name}`,
        status: ESTIMATE_STATUS.DRAFT,
        components: [{
          id: `temp-${Date.now()}`,
          name: planItem.name,
          description: planItem.description || '',
          quantity: 1,
          resourceTypes: [],
          tasks: [{ 
            id: `temp-${Date.now()}-task`, 
            name: planItem.name, 
            description: '', 
            efforts: {} 
          }]
        }]
      });
      
      // Link the plan item to the new component
      if (newEstimate.components && newEstimate.components.length > 0) {
        await planItemsService.linkToEstimateComponent(
          planItem.id, 
          newEstimate.components[0].id
        );
      }
      
      showSuccess('New estimate created and linked');
      onLinked?.();
      
      navigate(`/estimator?estimateId=${newEstimate.id}`);
      onClose();
    } catch (err) {
      console.error('Failed to create estimate:', err);
      showError('Failed to create estimate');
    } finally {
      setLinking(false);
    }
  };

  const toggleEstimate = (estId) => {
    setExpandedEstimate(expandedEstimate === estId ? null : estId);
  };

  const selectComponent = (estId, compId) => {
    setSelectedEstimateId(estId);
    setSelectedComponentId(compId);
  };

  const isCurrentlyLinked = planItem.estimate_component_id != null;

  return (
    <div className="elm-overlay" onClick={onClose}>
      <div className="elm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="elm-header">
          <div className="elm-header-icon">
            <Link2 size={20} />
          </div>
          <div className="elm-header-text">
            <h3>Link to Estimate</h3>
            <p>Connect "{planItem.name}" to an estimate component</p>
          </div>
          <button className="elm-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="elm-body">
          {loading ? (
            <div className="elm-loading">
              <Loader2 size={32} className="elm-spinner" />
              <p>Loading estimates...</p>
            </div>
          ) : (
            <>
              {/* Currently Linked Info */}
              {isCurrentlyLinked && (
                <div className="elm-current-link">
                  <div className="elm-current-link-info">
                    <Check size={16} />
                    <span>Currently linked to: <strong>{planItem.estimate_component_name}</strong></span>
                    <span className="elm-current-link-cost">
                      {formatCurrency(planItem.estimate_cost)}
                    </span>
                  </div>
                  <button 
                    className="elm-unlink-btn"
                    onClick={handleUnlink}
                    disabled={linking}
                  >
                    <Unlink size={14} />
                    Unlink
                  </button>
                </div>
              )}

              {/* Mode Tabs */}
              <div className="elm-tabs">
                <button 
                  className={`elm-tab ${mode === 'select' ? 'active' : ''}`}
                  onClick={() => setMode('select')}
                >
                  Link to Existing
                </button>
                <button 
                  className={`elm-tab ${mode === 'create' ? 'active' : ''}`}
                  onClick={() => setMode('create')}
                >
                  Create New Estimate
                </button>
              </div>

              {mode === 'select' ? (
                <>
                  {estimates.length === 0 ? (
                    <div className="elm-empty">
                      <Calculator size={32} />
                      <p>No estimates found for this project.</p>
                      <button 
                        className="elm-btn elm-btn-primary"
                        onClick={() => setMode('create')}
                      >
                        <Plus size={16} />
                        Create New Estimate
                      </button>
                    </div>
                  ) : (
                    <div className="elm-estimates-list">
                      {estimates.map(est => (
                        <div key={est.id} className="elm-estimate-item">
                          <div 
                            className="elm-estimate-header"
                            onClick={() => toggleEstimate(est.id)}
                          >
                            <ChevronRight 
                              size={16} 
                              className={`elm-chevron ${expandedEstimate === est.id ? 'expanded' : ''}`}
                            />
                            <div className="elm-estimate-info">
                              <span className="elm-estimate-name">{est.name}</span>
                              <span className="elm-estimate-meta">
                                {est.components?.length || 0} components • {formatCurrency(est.total_cost)}
                              </span>
                            </div>
                          </div>
                          
                          {expandedEstimate === est.id && (
                            <div className="elm-components-list">
                              {(!est.components || est.components.length === 0) ? (
                                <div className="elm-no-components">
                                  No components in this estimate
                                </div>
                              ) : (
                                est.components.map(comp => (
                                  <div 
                                    key={comp.id}
                                    className={`elm-component-item ${selectedComponentId === comp.id ? 'selected' : ''}`}
                                    onClick={() => selectComponent(est.id, comp.id)}
                                  >
                                    <div className="elm-component-radio">
                                      {selectedComponentId === comp.id && <Check size={14} />}
                                    </div>
                                    <div className="elm-component-info">
                                      <span className="elm-component-name">{comp.name}</span>
                                      <span className="elm-component-meta">
                                        {comp.total_days || 0} days • {formatCurrency(comp.total_cost)}
                                        {comp.quantity > 1 && ` × ${comp.quantity}`}
                                      </span>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="elm-create-section">
                  <div className="elm-create-preview">
                    <h4>New Estimate Preview</h4>
                    <div className="elm-preview-item">
                      <span className="elm-preview-label">Estimate Name:</span>
                      <span className="elm-preview-value">Estimate for {planItem.name}</span>
                    </div>
                    <div className="elm-preview-item">
                      <span className="elm-preview-label">Initial Component:</span>
                      <span className="elm-preview-value">{planItem.name}</span>
                    </div>
                    <div className="elm-preview-item">
                      <span className="elm-preview-label">Initial Task:</span>
                      <span className="elm-preview-value">{planItem.name}</span>
                    </div>
                  </div>
                  <p className="elm-create-info">
                    <AlertCircle size={14} />
                    A new estimate will be created with one component and task. 
                    You'll be taken to the Estimator to add resource types and effort.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="elm-footer">
          <button className="elm-btn elm-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          
          {mode === 'select' ? (
            <button 
              className="elm-btn elm-btn-primary"
              onClick={handleLinkToComponent}
              disabled={!selectedComponentId || linking}
            >
              {linking ? (
                <>
                  <Loader2 size={16} className="elm-spinner" />
                  Linking...
                </>
              ) : (
                <>
                  <Link2 size={16} />
                  Link to Component
                </>
              )}
            </button>
          ) : (
            <button 
              className="elm-btn elm-btn-primary"
              onClick={handleCreateNewEstimate}
              disabled={linking}
            >
              {linking ? (
                <>
                  <Loader2 size={16} className="elm-spinner" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Create & Open Estimator
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
